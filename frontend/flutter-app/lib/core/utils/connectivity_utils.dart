import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityUtils {
  static final _connectivity = Connectivity();
  
  static Future<bool> checkConnectivity() async {
    final result = await _connectivity.checkConnectivity();
    return !result.contains(ConnectivityResult.none);
  }
  
  static Stream<List<ConnectivityResult>> get onConnectivityChanged =>
      _connectivity.onConnectivityChanged;
  
  static Future<bool> hasInternetConnection() async {
    try {
      final result = await _connectivity.checkConnectivity();
      if (result.contains(ConnectivityResult.none)) {
        return false;
      }
      
      // Additional check can be added here to ping a server
      return true;
    } catch (e) {
      return false;
    }
  }
}