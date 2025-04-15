// Tailwind config with issues
module.exports = {
  // Missing content configuration
  purge: ['./pages/**/*.js', './components/**/*.jsx'],
  
  // Not using the extend pattern properly
  theme: {
    colors: {
      // Overriding colors instead of extending
      blue: {
        100: '#e6f2ff',
        500: '#2563eb',
        900: '#1e3a8a',
      },
      green: {
        100: '#dcfce7',
        500: '#22c55e',
        900: '#14532d',
      },
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
  },
  
  // Missing plugins
  plugins: [],
  
  // Missing dark mode configuration
}