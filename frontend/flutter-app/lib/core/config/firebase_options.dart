import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for macos - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.windows:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for windows - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for linux - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyCx7TWYTrvz6uIz_HqG06zCA79NdFzi2l0',
    authDomain: 'pika-demo.firebaseapp.com',
    projectId: 'pika-demo',
    storageBucket: 'pika-demo.firebasestorage.app',
    messagingSenderId: '303337225326',
    appId: '1:303337225326:web:c6da47f5f2dcde0564fa7f',
    measurementId: 'G-ZN1H2X5SQS',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyCx7TWYTrvz6uIz_HqG06zCA79NdFzi2l0',
    appId: '1:303337225326:android:your_android_app_id',
    messagingSenderId: '303337225326',
    projectId: 'pika-demo',
    storageBucket: 'pika-demo.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyCx7TWYTrvz6uIz_HqG06zCA79NdFzi2l0',
    appId: '1:303337225326:ios:your_ios_app_id',
    messagingSenderId: '303337225326',
    projectId: 'pika-demo',
    storageBucket: 'pika-demo.firebasestorage.app',
    iosClientId: 'your_ios_client_id',
    iosBundleId: 'com.pika.app',
  );
}