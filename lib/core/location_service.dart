import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

class LocationService {
  Future<Position> getCurrentPosition() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Location services are disabled.');
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied) {
      throw Exception('Location permission denied.');
    }

    if (permission == LocationPermission.deniedForever) {
      throw Exception('Location permission permanently denied.');
    }

    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
      ),
    );
  }
}

final locationServiceProvider = Provider<LocationService>((ref) {
  return LocationService();
});

final currentLocationProvider = FutureProvider<Position>((ref) async {
  return ref.read(locationServiceProvider).getCurrentPosition();
});
