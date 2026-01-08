#!/bin/bash

# Environment Setup Script for Inventory SAS
# This script helps set up environment variables for development

set -e

echo "=========================================="
echo "Inventory SAS - Environment Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if .env.example exists
if [ ! -f ".env.example" ]; then
    print_error ".env.example not found!"
    exit 1
fi

# Backend setup
echo "Setting up Backend environment..."
echo ""

if [ -f ".env" ]; then
    print_warning ".env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Skipping backend .env creation"
    else
        cp .env.example .env
        print_success "Created .env from template"
    fi
else
    cp .env.example .env
    print_success "Created .env from template"
fi

# Generate SECRET_KEY
echo ""
print_info "Generating Django SECRET_KEY..."
if command -v python3 &> /dev/null; then
    SECRET_KEY=$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
    
    # Update .env file with generated SECRET_KEY
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
    else
        # Linux
        sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
    fi
    
    print_success "Generated and set SECRET_KEY"
else
    print_warning "Python3 not found. Please manually set SECRET_KEY in .env"
fi

# Frontend setup
echo ""
echo "Setting up Frontend environment..."
echo ""

if [ ! -f "frontend/.env.example" ]; then
    print_error "frontend/.env.example not found!"
else
    if [ -f "frontend/.env" ]; then
        print_warning "frontend/.env file already exists!"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Skipping frontend .env creation"
        else
            cp frontend/.env.example frontend/.env
            print_success "Created frontend/.env from template"
        fi
    else
        cp frontend/.env.example frontend/.env
        print_success "Created frontend/.env from template"
    fi
fi

# Summary
echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
print_success "Backend .env file created/updated"
print_success "Frontend .env file created/updated"
echo ""
print_info "Next steps:"
echo "  1. Review and update .env files if needed"
echo "  2. Install backend dependencies: pip install -r requirements.txt"
echo "  3. Run migrations: python manage.py migrate"
echo "  4. Create superuser: python manage.py createsuperuser"
echo "  5. Install frontend dependencies: cd frontend && npm install"
echo "  6. Start backend: python manage.py runserver"
echo "  7. Start frontend: cd frontend && npm run dev"
echo ""
print_info "For detailed instructions, see ENVIRONMENT_SETUP.md"
echo ""
