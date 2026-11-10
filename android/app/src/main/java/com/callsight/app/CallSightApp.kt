package com.callsight.app

import android.app.Application

class CallSightApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialize global app configuration, analytics-free logging, and WebRTC factory
    }
}
