<?php

namespace App\Http\Controllers\Api\Web;

use App\Http\Controllers\Controller;

class WebBaseController extends Controller
{
    /**
     * Format success response for web
     */
    protected function webSuccess($data = null, $message = 'Success', $status = 200)
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
     * Format error response for web
     */
    protected function webError($message = 'Error', $errors = null, $status = 400)
    {
        $response = ['success' => false, 'message' => $message];
        
        if ($errors !== null) {
            $response['errors'] = $errors;
        }
        
        return response()->json($response, $status);
    }
    
    /**
     * Format paginated response for web
     */
    protected function webPaginated($paginator, $message = 'Success')
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ]
        ]);
    }
}