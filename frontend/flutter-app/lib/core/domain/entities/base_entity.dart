/// Base entity class following DDD principles
/// All domain entities should extend this class
abstract class BaseEntity {
  const BaseEntity();
  
  /// Unique identifier for the entity
  String get id;
  
  /// Timestamp when entity was created
  DateTime? get createdAt;
  
  /// Timestamp when entity was last updated
  DateTime? get updatedAt;
  
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! BaseEntity) return false;
    return id == other.id;
  }
  
  @override
  int get hashCode => id.hashCode;
}