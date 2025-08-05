# Voucher Service Architecture Migration

## Current State (Before Transformation)

### READ Side

- Basic Voucher entity with constructor-based properties
- Public readonly properties (not using getters)
- MultilingualText as simple interface
- Basic business methods: `canBePublished()`, `isExpired()`, `getLocalizedTitle()`
- Static factory method `fromObject()` handling snake_case conversion

### WRITE Side

- More sophisticated domain entity with private props pattern
- MultilingualText as a proper Value Object with validation
- Enums for VoucherState and DiscountType
- Rich business behaviors: `publish()`, `expire()`, `incrementRedemptions()`
- Factory methods: `create()` and `reconstitute()`
- Update method with partial updates support

### Issues to Address

1. Inconsistency between READ and WRITE domain entities
2. READ entity doesn't follow Admin Service patterns (no private props, no factory methods)
3. MultilingualText implementation differs between READ and WRITE
4. Missing document mapper for clean separation
5. Repository might be using SDK types directly

## Target State (Admin Service Gold Standard)

### Domain Entity Pattern

- Private props with readonly accessors
- Factory methods for controlled creation
- Business logic encapsulated in methods
- Validation in constructor/factory methods
- Clean separation from persistence concerns

### Repository Pattern

- Use domain entities, not SDK types
- Custom document mapping
- Comprehensive error handling
- Business-specific query methods

### Key Transformations Needed

1. **READ Domain Entity**:
   - Convert to private props pattern
   - Add proper factory methods (create, reconstitute)
   - Use consistent MultilingualText implementation
   - Enhance business methods

2. **Document Mappers**:
   - Create VoucherDocumentMapper for READ side
   - Handle snake_case to camelCase conversions
   - Ensure MultilingualText mapping consistency

3. **Repository Updates**:
   - Remove SDK dependencies
   - Use document mapper for transformations
   - Add comprehensive error handling
   - Add business-specific methods

4. **Type Consistency**:
   - Align MultilingualText between READ and WRITE
   - Use shared types from @pika/types-core
   - Ensure VoucherState and DiscountType consistency

## Migration Strategy

1. Create enhanced READ domain entity following Admin patterns
2. Implement VoucherDocumentMapper for database transformations
3. Update repository to use mapper and domain entities
4. Ensure all tests pass without modification
5. Add any missing business logic methods
6. Document any deviations from standard patterns
