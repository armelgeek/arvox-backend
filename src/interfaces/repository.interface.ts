/**
 * Generic repository interface for data access operations
 * @template TModel - The entity/model type
 * @template TId - The identifier type (default: string)
 */
export interface IRepository<TModel, TId = string> {
  /**
   * Find entity by ID
   * @param id - Entity identifier
   * @returns Promise with entity or null if not found
   */
  findById(id: TId): Promise<TModel | null>

  /**
   * Find all entities with optional pagination
   * @param pagination - Optional pagination parameters
   * @returns Promise with array of entities
   */
  findAll(pagination?: { skip: number; limit: number }): Promise<TModel[]>

  /**
   * Create new entity
   * @param data - Data for entity creation
   * @returns Promise with created entity
   */
  create(data: Omit<TModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<TModel>

  /**
   * Update existing entity
   * @param id - Entity identifier
   * @param data - Partial data for update
   * @returns Promise with updated entity
   */
  update(id: TId, data: Partial<Omit<TModel, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TModel>

  /**
   * Delete entity by ID
   * @param id - Entity identifier
   * @returns Promise with boolean indicating success
   */
  delete(id: TId): Promise<boolean>

  /**
   * Count total entities matching optional criteria
   * @param criteria - Optional search criteria
   * @returns Promise with total count
   */
  count(criteria?: any): Promise<number>

  /**
   * Check if entity exists by ID
   * @param id - Entity identifier
   * @returns Promise with boolean indicating existence
   */
  exists?(id: TId): Promise<boolean>

  /**
   * Find entities by IDs
   * @param ids - Array of entity identifiers
   * @returns Promise with array of found entities
   */
  findByIds?(ids: TId[]): Promise<TModel[]>
}
