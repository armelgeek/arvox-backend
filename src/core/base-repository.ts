import { IRepository } from '../interfaces/repository.interface'

/**
 * Base repository class providing common database operations
 * Uses generic types to ensure type safety across all repositories
 */
export abstract class BaseRepository<TEntity, TId = string> 
  implements IRepository<TEntity, TId> {

  /**
   * Find entity by ID
   * @param id - Entity identifier
   * @returns Promise with entity or null if not found
   */
  abstract findById(id: TId): Promise<TEntity | null>

  /**
   * Find all entities with optional pagination
   * @param pagination - Optional pagination parameters
   * @returns Promise with array of entities
   */
  abstract findAll(pagination?: { skip: number; limit: number }): Promise<TEntity[]>

  /**
   * Create new entity
   * @param data - Data for entity creation
   * @returns Promise with created entity
   */
  abstract create(data: Omit<TEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<TEntity>

  /**
   * Update existing entity
   * @param id - Entity identifier
   * @param data - Partial data for update
   * @returns Promise with updated entity
   */
  abstract update(id: TId, data: Partial<Omit<TEntity, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TEntity>

  /**
   * Delete entity by ID
   * @param id - Entity identifier
   * @returns Promise with boolean indicating success
   */
  abstract delete(id: TId): Promise<boolean>

  /**
   * Count total entities matching optional criteria
   * @param criteria - Optional search criteria
   * @returns Promise with total count
   */
  abstract count(criteria?: any): Promise<number>

  /**
   * Check if entity exists by ID
   * @param id - Entity identifier
   * @returns Promise with boolean indicating existence
   */
  async exists(id: TId): Promise<boolean> {
    const entity = await this.findById(id)
    return entity !== null
  }

  /**
   * Find entities by IDs
   * @param ids - Array of entity identifiers
   * @returns Promise with array of found entities
   */
  async findByIds(ids: TId[]): Promise<TEntity[]> {
    const entities = await Promise.all(
      ids.map(id => this.findById(id))
    )
    return entities.filter(entity => entity !== null) as TEntity[]
  }

  /**
   * Soft delete entity (if supported by implementation)
   * @param id - Entity identifier
   * @returns Promise with boolean indicating success
   */
  async softDelete(id: TId): Promise<boolean> {
    // Default implementation - override in child classes if soft delete is supported
    return this.delete(id)
  }

  /**
   * Restore soft deleted entity (if supported by implementation)
   * @param id - Entity identifier
   * @returns Promise with restored entity or null
   */
  async restore(id: TId): Promise<TEntity | null> {
    // Default implementation - override in child classes if restoration is supported
    throw new Error('Restore operation not implemented')
  }

  /**
   * Find entities with search functionality
   * @param searchTerm - Search term
   * @param searchFields - Fields to search in
   * @param pagination - Optional pagination
   * @returns Promise with search results
   */
  async search(
    searchTerm: string,
    searchFields: string[],
    pagination?: { skip: number; limit: number }
  ): Promise<TEntity[]> {
    // Default implementation - override in child classes for specific search logic
    throw new Error('Search operation not implemented')
  }

  /**
   * Batch create entities
   * @param dataArray - Array of creation data
   * @returns Promise with array of created entities
   */
  async batchCreate(dataArray: Array<Omit<TEntity, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TEntity[]> {
    const entities = await Promise.all(
      dataArray.map(data => this.create(data))
    )
    return entities
  }

  /**
   * Batch update entities
   * @param updates - Array of {id, data} objects
   * @returns Promise with array of updated entities
   */
  async batchUpdate(updates: Array<{id: TId; data: Partial<Omit<TEntity, 'id' | 'createdAt' | 'updatedAt'>>}>): Promise<TEntity[]> {
    const entities = await Promise.all(
      updates.map(update => this.update(update.id, update.data))
    )
    return entities
  }

  /**
   * Batch delete entities
   * @param ids - Array of entity identifiers
   * @returns Promise with boolean indicating success
   */
  async batchDelete(ids: TId[]): Promise<boolean> {
    const results = await Promise.all(
      ids.map(id => this.delete(id))
    )
    return results.every(result => result === true)
  }
}
