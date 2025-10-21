import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/button'

interface DatePickerProps {
  selectedDate: string
  onDateSelect: (date: string) => void
  minDate?: Date
  maxDaysAhead?: number
}

export function DatePicker({ 
  selectedDate, 
  onDateSelect, 
  minDate = new Date(),
  maxDaysAhead = 60 
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay()

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ]

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + maxDaysAhead)
    
    return date < today || date > maxDate
  }

  const formatDate = (day: number) => {
    const year = currentMonth.getFullYear()
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    return `${year}-${month}-${dayStr}`
  }

  const isToday = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const canGoPrevious = () => {
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    const today = new Date()
    return prevMonth.getMonth() >= today.getMonth() && prevMonth.getFullYear() >= today.getFullYear()
  }

  // Generate calendar grid
  const calendarDays = []
  
  // Empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="p-2" />)
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(day)
    const isSelected = selectedDate === dateStr
    const disabled = isDateDisabled(day)
    const today = isToday(day)
    
    calendarDays.push(
      <button
        key={day}
        type="button"
        onClick={() => !disabled && onDateSelect(dateStr)}
        disabled={disabled}
        className={`
          p-2 rounded-lg text-sm font-medium transition-all
          ${disabled 
            ? 'text-gray-300 cursor-not-allowed' 
            : 'hover:bg-gray-100 cursor-pointer'
          }
          ${isSelected 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : ''
          }
          ${today && !isSelected 
            ? 'border-2 border-blue-600 text-blue-600' 
            : ''
          }
        `}
      >
        {day}
      </button>
    )
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={goToPreviousMonth}
          disabled={!canGoPrevious()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h3 className="font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={goToNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t flex items-center justify-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 border-2 border-blue-600 rounded"></div>
          <span>Oggi</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 bg-blue-600 rounded"></div>
          <span>Selezionato</span>
        </div>
      </div>
    </div>
  )
}
