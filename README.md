# Inventory SAS - Sales & Inventory Management System

A comprehensive inventory and sales management system built with Django (backend) and React (frontend).

## Features

- 📦 Product Management
- 📊 Sales Tracking & Analytics
- 👥 Customer Management
- 🏪 Supplier Management
- 💰 Point of Sale (POS)
- 📈 Reports & Analytics
- 👤 User Management with Role-Based Access Control
- 🔐 Secure Authentication with JWT
- 🎨 Modern, Responsive UI

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 16+
- PostgreSQL (for production) or SQLite (for development)

### Environment Setup

**Important:** This application requires environment variables to be configured before running.

📖 **See [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for detailed setup instructions.**

Quick setup:
```bash
# Backend
cp .env.example .env
# Edit .env with your configuration

# Frontend
cd frontend
cp .env.example .env
# Edit .env with your configuration
```

### Backend Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Environment Variables

### Required Backend Variables
- `SECRET_KEY` - Django secret key (generate with provided command)
- `DEBUG` - Debug mode (True/False)
- `ALLOWED_HOSTS` - Comma-separated list of allowed hosts
- `CORS_ALLOWED_ORIGINS` - Comma-separated list of CORS origins

### Required Frontend Variables
- `VITE_API_URL` - Backend API URL

See [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for complete documentation.

## Deployment

### Render.com

The project includes a `render.yaml` configuration file for easy deployment to Render.com.

1. Push your code to GitHub
2. Connect your repository to Render
3. Configure environment variables in Render dashboard
4. Deploy!

See [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for detailed deployment instructions.

## Project Structure

```
inventorySAS/
├── inventory/              # Django project settings
├── inventory_api/          # Django app (models, views, serializers)
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── contexts/     # React contexts
│   └── .env.example      # Frontend environment template
├── .env.example           # Backend environment template
├── render.yaml            # Render deployment config
└── requirements.txt       # Python dependencies
```

## Technology Stack

### Backend
- Django 4.2
- Django REST Framework
- PostgreSQL / SQLite
- JWT Authentication
- CORS Headers

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Axios
- React Query

## Security

- 🔒 JWT-based authentication
- 🛡️ CORS protection
- 🔐 Environment-based configuration
- 👮 Role-based access control
- 🚫 SQL injection protection (Django ORM)

**Important:** Never commit `.env` files to version control. Use `.env.example` as a template.

## Documentation

- [Environment Setup Guide](ENVIRONMENT_SETUP.md) - Detailed environment configuration
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md) - Feature implementation details
- [User Management TODO](USER_MANAGEMENT_TODO.md) - User management features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is proprietary software.

## Support

For issues and questions, please create an issue in the repository.

---

**⚠️ Important:** Before running the application, make sure to set up your environment variables as described in [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md).
