<?php
// app/Services/FaceRecognitionService.php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;

class FaceRecognitionService
{
    protected string $apiUrl;
    protected string $apiKey;
    protected float $confidenceThreshold;

    public function __construct()
    {
        $this->apiUrl = config('services.face_service.url', 'http://localhost:8001');
        $this->apiKey = config('services.face_service.api_key', 'qih16CqnbrRsNMiZTOCBwPvNX_R5WvAHruFc2HhOtyQ');
        $this->confidenceThreshold = config('services.face_service.confidence_threshold', 0.82);
    }

    /**
     * Register a face for a user
     */
    public function registerFace(int $userId, UploadedFile $faceImage): array
    {
        try {
            $base64Image = $this->imageToBase64($faceImage);
            
            $response = Http::withHeaders([
                'X-API-Key' => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl . '/register-face', [
                'student_id' => $userId,
                'face_image' => $base64Image,
                'confidence_required' => $this->confidenceThreshold,
            ]);

            if ($response->successful()) {
                $result = $response->json();
                Log::info('Face registration successful', [
                    'user_id' => $userId,
                    'confidence' => $result['confidence'] ?? 0,
                ]);
                return $result;
            }

            Log::error('Face registration failed', [
                'user_id' => $userId,
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

            return [
                'success' => false,
                'message' => 'Face registration service error',
            ];
        } catch (\Exception $e) {
            Log::error('Face registration exception', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
            return [
                'success' => false,
                'message' => 'Could not process face registration: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Verify a face against stored encodings
     */
     public function verifyFace(string $faceImage, array $storedEncodings): array
    {
        try {
            $response = Http::withHeaders([
                'X-API-Key' => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl . '/recognize-face', [
                'face_image' => $faceImage,
                'stored_encodings' => $storedEncodings,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            return [
                'match' => false,
                'confidence' => 0,
                'message' => 'Face verification service error',
            ];
        } catch (\Exception $e) {
            Log::error('Face verification exception', [
                'error' => $e->getMessage(),
            ]);
            return [
                'match' => false,
                'confidence' => 0,
                'message' => 'Could not verify face: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Compare two face encodings directly
     */
    public function compareFaces(array $encoding1, array $encoding2): array
    {
        try {
            $response = Http::withHeaders([
                'X-API-Key' => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl . '/compare-faces', [
                'encoding1' => $encoding1,
                'encoding2' => $encoding2,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            return [
                'match' => false,
                'confidence' => 0,
                'distance' => 1.0,
                'error' => 'Comparison service error',
            ];
        } catch (\Exception $e) {
            Log::error('Face comparison exception', [
                'error' => $e->getMessage(),
            ]);
            return [
                'match' => false,
                'confidence' => 0,
                'distance' => 1.0,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Validate if an image contains a clear face
     */
     public function validateFace(UploadedFile $faceImage): array
    {
        try {
            $base64Image = $this->imageToBase64($faceImage);
            
            $response = Http::withHeaders([
                'X-API-Key' => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl . '/validate-face', [
                'face_image' => $base64Image,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            return [
                'success' => false,
                'has_face' => false,
                'confidence' => 0,
                'message' => 'Face validation service error',
            ];
        } catch (\Exception $e) {
            Log::error('Face validation exception', [
                'error' => $e->getMessage(),
            ]);
            return [
                'success' => false,
                'has_face' => false,
                'confidence' => 0,
                'message' => 'Could not validate face: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Check if the face service is healthy
     */
    public function healthCheck(): bool
    {
        try {
            $response = Http::get($this->apiUrl . '/health');
            return $response->successful();
        } catch (\Exception $e) {
            Log::error('Face service health check failed', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Convert uploaded file to base64
     */
     protected function imageToBase64(UploadedFile $image): string
    {
        $contents = file_get_contents($image->getRealPath());
        return 'data:' . $image->getMimeType() . ';base64,' . base64_encode($contents);
    }

    /**
     * Get quality feedback for face registration
     */
    public function getRegistrationTips(array $qualityBreakdown): string
    {
        if (empty($qualityBreakdown)) {
            return 'Please ensure your face is clearly visible and well-lit.';
        }

        $tips = [];
        foreach ($qualityBreakdown as $factor => $score) {
            if ($score < 0.6) {
                $tips[] = $this->getFactorTip($factor);
            }
        }

        return implode(' ', $tips) ?: 'Your face looks good! Proceed with registration.';
    }

    protected function getFactorTip(string $factor): string
    {
        $tips = [
            'framing_size' => 'Move closer so your face fills more of the frame.',
            'centering' => 'Center your face in the frame.',
            'sharpness' => 'Hold the camera steady and make sure the image is in focus.',
            'lighting' => 'Move to a better-lit area, avoiding strong backlight.',
            'angle' => 'Face the camera directly rather than at an angle.',
        ];

        return $tips[$factor] ?? 'Adjust your position for better quality.';
    }
}