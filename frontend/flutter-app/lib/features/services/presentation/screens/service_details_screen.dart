import 'package:flutter/material.dart';

class ServiceDetailsScreen extends StatelessWidget {
  final String serviceId;
  
  const ServiceDetailsScreen({
    super.key,
    required this.serviceId,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Service Details'),
      ),
      body: Center(
        child: Text('Service Details Screen - ID: $serviceId'),
      ),
    );
  }
}