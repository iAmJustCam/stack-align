import { runValidatorTests } from './validator-simple';
import { runAllTransformerTests } from './healing-test-harness';

/**
 * Main function to run all tests
 */
async function runAllTests() {
  console.log('🔍 Running fixture validation tests...');
  await runValidatorTests();
  
  console.log('\n🔧 Running healing transformer tests...');
  await runAllTransformerTests();
  
  console.log('\n✅ All tests completed!');
}

// Run all tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
}