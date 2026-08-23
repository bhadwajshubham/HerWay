import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;

import '../../core/app_config.dart';
import '../../core/location_service.dart';
import '../../theme/app_theme.dart';
import 'map_screen.dart';

class SearchLocationScreen extends ConsumerStatefulWidget {
  const SearchLocationScreen({super.key});

  @override
  ConsumerState<SearchLocationScreen> createState() =>
      _SearchLocationScreenState();
}

class _SearchLocationScreenState extends ConsumerState<SearchLocationScreen> {
  final TextEditingController _pickupController = TextEditingController(
    text: 'Current Location (Hitec City)',
  );
  final TextEditingController _dropoffController = TextEditingController();
  bool _navigating = false;
  final List<Map<String, String>> _popularPlaces = [
    {
      'title': 'RGIA Hyderabad International Airport',
      'subtitle': 'Shamshabad, Hyderabad',
      'distance': '28.4 km',
      'lat': '17.2403',
      'lng': '78.4294',
    },
    {
      'title': 'Gachibowli DLF Cyber City',
      'subtitle': 'Gachibowli, Hyderabad',
      'distance': '3.2 km',
      'lat': '17.4430',
      'lng': '78.3558',
    },
    {
      'title': 'Inorbit Mall Hitec City',
      'subtitle': 'APIIC Software Layout, Hyderabad',
      'distance': '1.8 km',
      'lat': '17.4486',
      'lng': '78.3892',
    },
    {
      'title': 'Secunderabad Junction Railway Station',
      'subtitle': 'Secunderabad, Telangana',
      'distance': '16.5 km',
      'lat': '17.4399',
      'lng': '78.4983',
    },
    {
      'title': 'Jubilee Hills Check Post',
      'subtitle': 'Road No. 36, Jubilee Hills',
      'distance': '5.1 km',
      'lat': '17.4285',
      'lng': '78.4070',
    },
  ];

  List<Map<String, String>> _filteredPlaces = [];
  int _searchRequestId = 0;
  bool _isSearchingOnline = false;

  @override
  void initState() {
    super.initState();
    _filteredPlaces = _popularPlaces;
    _dropoffController.addListener(_onSearchChanged);
  }

  void _onSearchChanged() {
    final query = _dropoffController.text.toLowerCase().trim();
    final requestId = ++_searchRequestId;
    setState(() {
      if (query.isEmpty) {
        _filteredPlaces = _popularPlaces;
      } else {
        _filteredPlaces = _popularPlaces.where((place) {
          return place['title']!.toLowerCase().contains(query) ||
              place['subtitle']!.toLowerCase().contains(query);
        }).toList();
      }
    });
    if (query.length >= 3 && _filteredPlaces.isEmpty) {
      _searchOnline(query, requestId);
    }
  }

  Future<void> _searchOnline(String query, int requestId) async {
    final key = AppConfig.googleMapsApiKey;
    if (key.isEmpty) return;
    setState(() => _isSearchingOnline = true);
    try {
      final response = await http.get(
        Uri.https('maps.googleapis.com', '/maps/api/geocode/json', {
          'address': '$query, Hyderabad',
          'key': key,
        }),
      ).timeout(const Duration(seconds: 8));
      if (!mounted || requestId != _searchRequestId) return;
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final results = data['results'] as List<dynamic>?;
      if (response.statusCode == 200 &&
          data['status'] == 'OK' &&
          results != null &&
          results.isNotEmpty) {
        final result = results.first as Map<String, dynamic>;
        final geometry = result['geometry'] as Map<String, dynamic>;
        final location = geometry['location'] as Map<String, dynamic>;
        final place = <String, String>{
          'title': result['formatted_address'] as String? ?? query,
          'subtitle': 'Google Maps result',
          'distance': 'Route',
          'lat': '${location['lat']}',
          'lng': '${location['lng']}',
        };
        setState(() => _filteredPlaces = [place]);
      }
    } catch (_) {
      // Local suggestions remain available when online search is unavailable.
    } finally {
      if (mounted && requestId == _searchRequestId) {
        setState(() => _isSearchingOnline = false);
      }
    }
  }

  void _selectLocation(Map<String, String> place, Position? currentLocation) {
    if (_navigating) return;
    
    // Validate required coordinates
    final lat = double.tryParse(place['lat'] ?? '');
    final lng = double.tryParse(place['lng'] ?? '');

    if (lat == null || lng == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not determine location coordinates.')),
      );
      return;
    }

    _navigating = true;

    final pickupAddress = _pickupController.text.trim().isEmpty
        ? 'Current Location'
        : _pickupController.text.trim();

    final pickupLat = currentLocation?.latitude ?? 17.4435;
    final pickupLng = currentLocation?.longitude ?? 78.3772;

    FocusScope.of(context).unfocus();

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MapScreen(
          pickupAddress: pickupAddress,
          dropoffAddress: '${place['title']}${place['subtitle'] != null && place['subtitle']!.isNotEmpty ? ', ${place['subtitle']}' : ''}',
          pickupLat: pickupLat,
          pickupLng: pickupLng,
          dropoffLat: lat,
          dropoffLng: lng,
        ),
      ),
    ).then((_) {
      _navigating = false;
    });
  }

  @override
  void dispose() {
    _dropoffController.dispose();
    _pickupController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(currentLocationProvider, (previous, next) {
      final resolved = next.asData?.value;
      if (resolved != null) {
        if (_pickupController.text.trim().isEmpty ||
            _pickupController.text == 'Current Location (Hitec City)') {
          _pickupController.text = 'Current Location';
        }
      }
    });

    final isDarkMode = ref.watch(themeNotifierProvider) == ThemeMode.dark;
    final currentLocationAsync = ref.watch(currentLocationProvider);
    final currentLocation = currentLocationAsync.asData?.value;

    return Scaffold(
      backgroundColor: isDarkMode
          ? AppColors.charcoal
          : AppColors.appleBackground,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios_new_rounded,
            color: isDarkMode
                ? AppColors.softWhite
                : AppColors.appleTextPrimary,
            size: 20,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Select Destination',
          style: TextStyle(
            color: isDarkMode
                ? AppColors.softWhite
                : AppColors.appleTextPrimary,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
      ),
      body: Column(
        children: [
          // Input Fields Box
          Container(
            padding: const EdgeInsets.all(20),
            margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            decoration: BoxDecoration(
              color: isDarkMode ? AppColors.slate : AppColors.appleCard,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: isDarkMode ? Colors.white10 : AppColors.appleBorder,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(
                    ((isDarkMode ? 0.2 : 0.04) * 255).round(),
                  ),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                // Pickup Location Input
                Row(
                  children: [
                    const Icon(
                      Icons.circle,
                      color: Colors.greenAccent,
                      size: 14,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: TextField(
                        controller: _pickupController,
                        style: TextStyle(
                          color: isDarkMode
                              ? AppColors.softWhite
                              : AppColors.appleTextPrimary,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          hintText: 'Pickup Location',
                          isDense: true,
                        ),
                      ),
                    ),
                  ],
                ),
                Padding(
                  padding: const EdgeInsets.only(left: 6.0),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Container(
                      width: 2,
                      height: 20,
                      color: isDarkMode
                          ? Colors.white24
                          : AppColors.appleBorder,
                    ),
                  ),
                ),
                // Dropoff Location Input
                Row(
                  children: [
                    const Icon(
                      Icons.location_on_rounded,
                      color: AppColors.herOrange,
                      size: 16,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: TextField(
                        controller: _dropoffController,
                        autofocus: true,
                        style: TextStyle(
                          color: isDarkMode
                              ? AppColors.softWhite
                              : AppColors.appleTextPrimary,
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                        decoration: InputDecoration(
                          border: InputBorder.none,
                          hintText: 'Where to go?',
                          hintStyle: TextStyle(
                            color: isDarkMode
                                ? Colors.white38
                                : AppColors.appleTextSecondary,
                          ),
                          isDense: true,
                        ),
                      ),
                    ),
                    if (_dropoffController.text.isNotEmpty)
                      IconButton(
                        onPressed: () {
                          _dropoffController.clear();
                          FocusScope.of(context).unfocus();
                        },
                        tooltip: 'Clear',
                        icon: Icon(
                          Icons.cancel_rounded,
                          color: isDarkMode
                              ? Colors.white38
                              : AppColors.appleTextSecondary,
                          size: 18,
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Saved Places Chips Row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                _buildSavedChip(isDarkMode, Icons.home_rounded, 'Home'),
                _buildSavedChip(isDarkMode, Icons.work_rounded, 'Work'),
                _buildSavedChip(isDarkMode, Icons.school_rounded, 'College'),
                _buildSavedChip(isDarkMode, Icons.star_rounded, 'Favorites'),
              ],
            ),
          ),

          const SizedBox(height: 16),
          Divider(
            color: isDarkMode ? Colors.white10 : AppColors.appleBorder,
            height: 1,
          ),

          // Search Suggestions List
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              itemCount: _filteredPlaces.length + (_isSearchingOnline ? 1 : 0),
              separatorBuilder: (context, index) => Divider(
                color: isDarkMode ? Colors.white10 : AppColors.appleBorder,
                height: 1,
              ),
              itemBuilder: (context, index) {
                if (index >= _filteredPlaces.length) {
                  return const ListTile(
                    leading: SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    title: Text('Searching Google Maps…'),
                  );
                }
                final place = _filteredPlaces[index];
                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(
                    vertical: 6,
                    horizontal: 4,
                  ),
                  onTap: () => _selectLocation(place, currentLocation),
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: isDarkMode
                          ? AppColors.slate
                          : AppColors.appleSlate,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.place_outlined,
                      color: isDarkMode
                          ? AppColors.softWhite
                          : AppColors.appleTextPrimary,
                      size: 20,
                    ),
                  ),
                  title: Text(
                    place['title']!,
                    style: TextStyle(
                      color: isDarkMode
                          ? AppColors.softWhite
                          : AppColors.appleTextPrimary,
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 2.0),
                    child: Text(
                      place['subtitle']!,
                      style: TextStyle(
                        color: isDarkMode
                            ? Colors.white54
                            : AppColors.appleTextSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  trailing: Text(
                    place['distance']!,
                    style: const TextStyle(
                      color: AppColors.herOrange,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSavedChip(bool isDarkMode, IconData icon, String label) {
    return GestureDetector(
      onTap: () {
        FocusScope.of(context).unfocus();
        _dropoffController.text = '$label Destination';
      },
      child: Container(
        margin: const EdgeInsets.only(right: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isDarkMode ? AppColors.slate : AppColors.appleCard,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isDarkMode ? Colors.white10 : AppColors.appleBorder,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.herOrange, size: 16),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: isDarkMode
                    ? AppColors.softWhite
                    : AppColors.appleTextPrimary,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
