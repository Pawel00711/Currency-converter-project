#include "ofApp.h"
#include <cstdio>
#include <iostream>

using namespace std;

// Global variables to store the fetched currency exchange rates
float ratePLN = 0.0f;
float rateEUR = 0.0f;
float rateGBP = 0.0f;
bool isDataLoaded = false;
string errorMessage = "";

void ofApp::setup() {
	ofSetWindowTitle("Currency Converter C++ (Direct cURL Fetch)");
	ofSetFrameRate(60);

	// Client authentication token for freecurrencyapi.com service
	string myApiKey = "fca_live_NHGFjKK3xDx02uCtGEzkuWwROwAnpaCvOZJe6QtU";

	// Construct the fully qualified REST API developer endpoint URL with target parameters
	string url = "https://api.freecurrencyapi.com/v1/latest?apikey=" + myApiKey + "&base_currency=USD";

	cout << "Connecting via system cURL to: " << url << endl;

	// Resolve the correct absolute path inside the openFrameworks data folder destination
	string outputPath = ofToDataPath("response.json", true);
	
	// Execute background system process via command line using cURL utilities with nested quotes for ampersand protection
	string command = "curl -s -k \"" + url + "\" > \"" + outputPath + "\"";
	system(command.c_str());

	// Initialize file streaming object targeting the newly created local JSON storage
	ofFile file("response.json");
	if (file.exists()) {
		// Read the file data into an openFrameworks buffer object before removal
		ofBuffer buffer = ofBufferFromFile("response.json");
		string rawJson = buffer.getText();

		// Guard condition checking for standard empty payloads or non-JSON web responses
		if (!rawJson.empty() && rawJson.find("{") != string::npos) {
			try {
				// Parse raw string content straight into the local structured object model representation
				ofJson json = ofJson::parse(rawJson);

				// Navigate and validate primary dictionary branches returned by the server instance
				if (json.contains("data")) {
					auto dataObject = json["data"];

					if (dataObject.contains("PLN")) ratePLN = dataObject["PLN"].get<float>();
					if (dataObject.contains("EUR")) rateEUR = dataObject["EUR"].get<float>();
					if (dataObject.contains("GBP")) rateGBP = dataObject["GBP"].get<float>();

					isDataLoaded = true;
				} else if (json.contains("message")) {
					errorMessage = "API Error: " + json["message"].get<string>();
				} else {
					errorMessage = "JSON structure invalid. 'data' object missing.";
				}
			} catch (const exception & e) {
				errorMessage = "JSON parsing error: " + string(e.what());
			}
		} else {
			errorMessage = "Downloaded API response file is empty or invalid.";
		}

		// Clean up the temporary cache assets from local disk space after processing is complete
		file.remove();
	} else {
		errorMessage = "System cURL execution failed to create the response file.";
	}
}

void ofApp::update() {
	// Frame-rate update cycle triggers here
}

void ofApp::draw() {
	// Apply dark styling to the graphical application viewport canvas
	ofBackground(40, 44, 52);

	ofSetColor(255, 255, 255);
	ofDrawBitmapString("=== CODELAB 2: C++ DIRECT CURRENCY ENGINE ===", 30, 40);
	ofDrawBitmapString("Connection: Direct internet call via Windows cURL", 30, 60);
	ofDrawBitmapString("-------------------------------------------------", 30, 75);

	// Render the primary interface state conditions depending on the fetch process results
	if (isDataLoaded) {
		ofSetColor(152, 195, 121); // Balanced green color value indicating standard safe operations
		ofDrawBitmapString("Status: LIVE DATA FETCHED SUCCESSFULLY", 30, 100);

		ofSetColor(255, 255, 255);
		ofDrawBitmapString("Current rates relative to base (1 USD):", 30, 130);

		ofSetColor(97, 175, 239); // Soft blue hue for displaying target numerical data
		ofDrawBitmapString("PLN: " + ofToString(ratePLN, 4) + " PLN", 50, 160);
		ofDrawBitmapString("EUR: " + ofToString(rateEUR, 4) + " EUR", 50, 190);
		ofDrawBitmapString("GBP: " + ofToString(rateGBP, 4) + " GBP", 50, 220);

		// Math logic preview representing 50 units conversion output
		float amountUSD = 50.0f;
		float calculatedPLN = amountUSD * ratePLN;
		ofSetColor(224, 108, 117); 
		ofDrawBitmapString("Calculator Preview:", 30, 260);
		ofSetColor(255, 255, 255);
		ofDrawBitmapString(ofToString(amountUSD, 2) + " USD = " + ofToString(calculatedPLN, 2) + " PLN", 50, 290);
	} else {
		ofSetColor(224, 108, 117); // Red color layout designating exception handling conditions
		ofDrawBitmapString("Status: CONNECTION ERROR / NO DATA", 30, 100);
		ofSetColor(255, 255, 255);
		ofDrawBitmapString("Details: " + errorMessage, 30, 130);
		ofSetColor(229, 192, 123); 
		ofDrawBitmapString("Tip: Ensure your device has an active internet connection.", 30, 160);
	}
}

// Required openFrameworks boilerplate methods
void ofApp::keyPressed(int key) { }
void ofApp::keyReleased(int key) { }
void ofApp::mouseMoved(int x, int y) { }
void ofApp::mouseDragged(int x, int y, int button) { }
void ofApp::mousePressed(int x, int y, int button) { }
void ofApp::mouseReleased(int x, int y, int button) { }
void ofApp::mouseEntered(int x, int y) { }
void ofApp::mouseExited(int x, int y) { }
void ofApp::windowResized(int w, int h) { }
void ofApp::gotMessage(ofMessage msg) { }
void ofApp::dragEvent(ofDragInfo dragInfo) { }
