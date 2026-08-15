import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../core/app_config.dart';

class RouteEstimate {
  const RouteEstimate({
    required this.points,
    required this.distanceKm,
    required this.durationMinutes,
  });

  final List<RoutePoint> points;
  final double distanceKm;
  final double durationMinutes;
}

class RoutePoint {
  const RoutePoint(this.latitude, this.longitude);

  final double latitude;
  final double longitude;
}

class RouteService {
  Future<RouteEstimate?> getRoute({
    required double pickupLat,
    required double pickupLng,
    required double dropoffLat,
    required double dropoffLng,
  }) async {
    final key = AppConfig.googleMapsApiKey;
    if (key.isEmpty) return null;

    final uri = Uri.https('maps.googleapis.com', '/maps/api/directions/json', {
      'origin': '$pickupLat,$pickupLng',
      'destination': '$dropoffLat,$dropoffLng',
      'mode': 'driving',
      'key': key,
    });
    final response = await http.get(uri).timeout(const Duration(seconds: 10));
    if (response.statusCode != 200) return null;

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (data['status'] != 'OK') return null;
    final routes = data['routes'] as List<dynamic>?;
    if (routes == null || routes.isEmpty) return null;

    final route = routes.first as Map<String, dynamic>;
    final legs = route['legs'] as List<dynamic>?;
    final leg = legs?.isNotEmpty == true
        ? legs!.first as Map<String, dynamic>
        : null;
    final distanceMeters =
        (leg?['distance'] as Map<String, dynamic>?)?['value'] as num?;
    final durationSeconds =
        (leg?['duration'] as Map<String, dynamic>?)?['value'] as num?;
    final encoded =
        (route['overview_polyline'] as Map<String, dynamic>?)?['points']
            as String?;
    if (distanceMeters == null || durationSeconds == null || encoded == null) {
      return null;
    }

    return RouteEstimate(
      points: _decodePolyline(encoded),
      distanceKm: distanceMeters / 1000,
      durationMinutes: durationSeconds / 60,
    );
  }

  List<RoutePoint> _decodePolyline(String encoded) {
    final points = <RoutePoint>[];
    var index = 0;
    var latitude = 0;
    var longitude = 0;

    while (index < encoded.length) {
      var result = 0;
      var shift = 0;
      int value;
      do {
        value = encoded.codeUnitAt(index++) - 63;
        result |= (value & 0x1f) << shift;
        shift += 5;
      } while (value >= 0x20 && index < encoded.length);
      latitude += (result & 1) != 0 ? ~(result >> 1) : result >> 1;

      result = 0;
      shift = 0;
      do {
        value = encoded.codeUnitAt(index++) - 63;
        result |= (value & 0x1f) << shift;
        shift += 5;
      } while (value >= 0x20 && index < encoded.length);
      longitude += (result & 1) != 0 ? ~(result >> 1) : result >> 1;

      points.add(RoutePoint(latitude / 1e5, longitude / 1e5));
    }
    return points;
  }
}
