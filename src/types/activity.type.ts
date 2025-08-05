export enum ActivityType {
  // Auth activities
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  VERIFY_EMAIL = 'verify_email',
  
  // User activities
  CREATE_USER = 'create_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  
  // Subscription activities
  SUBSCRIBING = 'subscribing',
  CHANGE_SUBSCRIPTION_PLAN = 'change_subscription_plan',
  CANCEL_SUBSCRIPTION = 'cancel_subscription',
  
  // Trial activities
  TRIAL_STARTED = 'trial_started',
  TRIAL_ENDED = 'trial_ended',
  TRIAL_ENDING_NOTIFICATION = 'trial_ending_notification',
  
  // File activities
  UPLOAD_FILE = 'upload_file',
  DELETE_FILE = 'delete_file',
  
  // Permission activities
  CREATE_ROLE = 'create_role',
  UPDATE_ROLE = 'update_role',
  DELETE_ROLE = 'delete_role',
  ASSIGN_ROLE = 'assign_role',
  
  // Generic activities
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete'
}
