import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/models/category_model.dart';
import '../../domain/models/service_model.dart';

// Categories provider
final categoriesProvider = StateNotifierProvider<CategoriesNotifier, AsyncValue<List<CategoryModel>>>((ref) {
  return CategoriesNotifier(ref);
});

class CategoriesNotifier extends StateNotifier<AsyncValue<List<CategoryModel>>> {
  final Ref ref;
  
  CategoriesNotifier(this.ref) : super(const AsyncValue.loading());
  
  Future<void> loadCategories() async {
    state = const AsyncValue.loading();
    
    try {
      // TODO: Implement API call to fetch categories
      await Future.delayed(const Duration(seconds: 1));
      
      // Mock data for now
      state = AsyncValue.data([
        CategoryModel(id: '1', name: 'Plumbing', slug: 'plumbing'),
        CategoryModel(id: '2', name: 'Electrical', slug: 'electrical'),
        CategoryModel(id: '3', name: 'Cleaning', slug: 'cleaning'),
        CategoryModel(id: '4', name: 'Gardening', slug: 'gardening'),
      ]);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }
}

// Featured services provider
final featuredServicesProvider = StateNotifierProvider<FeaturedServicesNotifier, AsyncValue<List<ServiceModel>>>((ref) {
  return FeaturedServicesNotifier(ref);
});

class FeaturedServicesNotifier extends StateNotifier<AsyncValue<List<ServiceModel>>> {
  final Ref ref;
  
  FeaturedServicesNotifier(this.ref) : super(const AsyncValue.loading());
  
  Future<void> loadFeaturedServices() async {
    state = const AsyncValue.loading();
    
    try {
      // TODO: Implement API call to fetch featured services
      await Future.delayed(const Duration(seconds: 1));
      
      // Mock data for now
      state = AsyncValue.data([
        ServiceModel(
          id: '1',
          name: 'Kitchen Plumbing Repair',
          description: 'Professional kitchen plumbing services',
          price: 50.0,
          providerId: 'provider1',
          categoryId: '1',
        ),
        ServiceModel(
          id: '2',
          name: 'House Electrical Inspection',
          description: 'Complete electrical system inspection',
          price: 100.0,
          providerId: 'provider2',
          categoryId: '2',
        ),
      ]);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }
}