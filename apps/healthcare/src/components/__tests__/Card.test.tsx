import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '../Card'

describe('Card Component', () => {
  const mockProvider = {
    id: '1',
    type: 'provider' as const,
    name: 'Dr. Test',
    title: 'Cardiologist',
    rating: 4.5,
    location: 'Test Hospital',
    languages: ['English', 'Arabic'],
    tags: ['Telehealth'],
    imageUrl: 'https://example.com/image.jpg',
    available: true
  }

  it('renders provider information correctly', () => {
    render(<Card data={mockProvider} />)
    
    expect(screen.getByText('Dr. Test')).toBeInTheDocument()
    expect(screen.getByText('Cardiologist')).toBeInTheDocument()
    expect(screen.getByText('Test Hospital')).toBeInTheDocument()
  })

  it('displays rating correctly', () => {
    render(<Card data={mockProvider} />)
    
    expect(screen.getByText('4.5')).toBeInTheDocument()
  })

  it('shows availability status', () => {
    render(<Card data={mockProvider} />)
    
    expect(screen.getByText('Available Now')).toBeInTheDocument()
  })
})
