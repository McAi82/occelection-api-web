<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MobileBaseController extends Controller
{
    /**
     * Format success response for mobile
     */
    protected function mobileSuccess($data = null, $message = 'Success', $status = 200)
    {
        $response = ['success' => true, 'message' => $message];
        
        if ($data !== null) {
            if (is_array($data) && isset($data['token'])) {
                $response['token'] = $data['token'];
                unset($data['token']);
            }
            $response['data'] = $data;
        }
        
        return response()->json($response, $status);
    }
    
    /**
     * Format error response for mobile
     */
    protected function mobileError($message = 'Error', $errors = null, $status = 400)
    {
        $response = ['success' => false, 'message' => $message];
        
        if ($errors !== null) {
            $response['errors'] = $errors;
        }
        
        return response()->json($response, $status);
    }
}