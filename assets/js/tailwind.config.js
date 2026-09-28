window.tailwind = window.tailwind || {};

tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        graphite: {
                            900: '#0F172A',
                            950: '#0A0F1D',
                        },
                        navy: {
                            800: '#1E3A8A',
                            900: '#172554',
                            950: '#090E1A',
                        },
                        brand: {
                            blue: '#1d4ed8',
                            accent: '#F59E0B',
                            accentHover: '#D97706',
                            formBlue: '#1668c7',
                            ctaPink: '#FF0055',
                            ctaPinkHover: '#E0004C',
                        }
                    },
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        heading: ['Oswald', 'sans-serif'],
                    }
                }
            }
        }
