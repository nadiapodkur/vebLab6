<?php
/**
 * Load Toasts API Endpoint
 * Returns saved toasts data from JSON file
 */

// CORS headers for local development
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Data file path
$dataFile = __DIR__ . '/data/toasts.json';

// Check if file exists
if (!file_exists($dataFile)) {
    // Return empty data structure
    echo json_encode([
        'timestamp' => null,
        'toasts' => []
    ]);
    exit();
}

// Read file contents
$jsonData = file_get_contents($dataFile);

if ($jsonData === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Could not read data file']);
    exit();
}

// Parse JSON
$data = json_decode($jsonData, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Invalid data in file']);
    exit();
}

// Return data
echo json_encode($data);
