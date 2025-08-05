// Test simple avec JavaScript pour éviter les problèmes de modules ES
import { ArvoxFramework } from '../dist/index.js'

console.log('🧪 Test du framework arvox-backend')
console.log('ArvoxFramework:', typeof ArvoxFramework)

try {
  const framework = new ArvoxFramework({
    appName: 'Test Simple',
    port: 3001,
    environment: 'development'
  })
  
  console.log('✅ Framework créé avec succès!')
  console.log('Configuration:', framework.getConfig())
  
} catch (error) {
  console.error('❌ Erreur lors du test:', error)
}
