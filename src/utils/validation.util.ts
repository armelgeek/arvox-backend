import { z, ZodError } from 'zod'

/**
 * Utility class for common validation patterns and schemas
 */
export class ValidationUtil {
  /**
   * Common UUID validation schema
   */
  static readonly uuidSchema = z.string().uuid('Invalid UUID format')

  /**
   * Common email validation schema
   */
  static readonly emailSchema = z.string().email('Invalid email format')

  /**
   * Common password validation schema
   */
  static readonly passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')

  /**
   * Common URL validation schema
   */
  static readonly urlSchema = z.string().url('Invalid URL format')

  /**
   * Common phone validation schema
   */
  static readonly phoneSchema = z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')

  /**
   * Pagination parameters validation schema
   */
  static readonly paginationSchema = z.object({
    page: z.number().int().min(1, 'Page must be at least 1').default(1),
    limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10)
  })

  /**
   * Common date validation schemas
   */
  static readonly dateSchema = z.date()
  static readonly dateStringSchema = z.string().datetime('Invalid date format')
  static readonly futureDateSchema = z.date().refine(
    date => date > new Date(),
    'Date must be in the future'
  )
  static readonly pastDateSchema = z.date().refine(
    date => date < new Date(),
    'Date must be in the past'
  )

  /**
   * File validation schemas
   */
  static readonly imageFileSchema = z.object({
    type: z.string().refine(
      type => type.startsWith('image/'),
      'File must be an image'
    ),
    size: z.number().max(5 * 1024 * 1024, 'Image size must not exceed 5MB')
  })

  static readonly documentFileSchema = z.object({
    type: z.string().refine(
      type => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(type),
      'File must be a PDF or Word document'
    ),
    size: z.number().max(10 * 1024 * 1024, 'Document size must not exceed 10MB')
  })

  /**
   * Create a custom file validation schema
   * @param allowedTypes - Array of allowed MIME types
   * @param maxSize - Maximum file size in bytes
   * @returns Zod schema for file validation
   */
  static createFileSchema(allowedTypes: string[], maxSize: number) {
    return z.object({
      type: z.string().refine(
        type => allowedTypes.includes(type),
        `File type must be one of: ${allowedTypes.join(', ')}`
      ),
      size: z.number().max(maxSize, `File size must not exceed ${maxSize / 1024 / 1024}MB`)
    })
  }

  /**
   * Validate and parse data with a schema
   * @param data - Data to validate
   * @param schema - Zod schema
   * @returns Parsed and validated data
   * @throws Error with formatted validation message
   */
  static validate<T>(data: any, schema: z.ZodSchema<T>): T {
    try {
      return schema.parse(data)
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((err: any) => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ')
        throw new Error(`Validation failed: ${errorMessages}`)
      }
      throw error
    }
  }

  /**
   * Safely validate data without throwing
   * @param data - Data to validate
   * @param schema - Zod schema
   * @returns Result object with success status and data or errors
   */
  static safeValidate<T>(data: any, schema: z.ZodSchema<T>): 
    { success: true; data: T } | { success: false; errors: Array<{ path: string; message: string }> } {
    
    const result = schema.safeParse(data)
    
    if (result.success) {
      return { success: true, data: result.data }
    } else {
      const errors = result.error.issues.map((err: any) => ({
        path: err.path.join('.'),
        message: err.message
      }))
      return { success: false, errors }
    }
  }

  /**
   * Create a schema for array validation with optional constraints
   * @param itemSchema - Schema for individual items
   * @param minItems - Minimum number of items
   * @param maxItems - Maximum number of items
   * @returns Array validation schema
   */
  static createArraySchema<T>(
    itemSchema: z.ZodSchema<T>,
    minItems?: number,
    maxItems?: number
  ) {
    let schema = z.array(itemSchema)
    
    if (minItems !== undefined) {
      schema = schema.min(minItems, `Array must contain at least ${minItems} items`)
    }
    
    if (maxItems !== undefined) {
      schema = schema.max(maxItems, `Array must contain at most ${maxItems} items`)
    }
    
    return schema
  }

  /**
   * Create a conditional schema based on another field
   * @param conditionField - Field to check
   * @param conditionValue - Value to match
   * @param trueSchema - Schema to use if condition is true
   * @param falseSchema - Schema to use if condition is false
   * @returns Conditional validation schema
   */
  static createConditionalSchema<T>(
    conditionField: string,
    conditionValue: any,
    trueSchema: z.ZodSchema<T>,
    falseSchema: z.ZodSchema<T>
  ) {
    return z.union([trueSchema, falseSchema]).refine(
      (data: any) => {
        if (data[conditionField] === conditionValue) {
          return trueSchema.safeParse(data).success
        } else {
          return falseSchema.safeParse(data).success
        }
      },
      'Conditional validation failed'
    )
  }

  /**
   * Create a schema for partial updates (all fields optional)
   * @param baseSchema - Base schema to make partial
   * @returns Partial schema
   */
  static createPartialSchema<T extends z.ZodRawShape>(baseSchema: z.ZodObject<T>) {
    return baseSchema.partial()
  }

  /**
   * Merge multiple schemas
   * @param schemas - Array of schemas to merge
   * @returns Merged schema
   */
  static mergeSchemas<T extends z.ZodObject<any>[]>(...schemas: T): z.ZodObject<any> {
    if (schemas.length === 0) {
      throw new Error('At least one schema is required')
    }
    
    return schemas.reduce((acc, schema) => acc.merge(schema), schemas[0])
  }
}
