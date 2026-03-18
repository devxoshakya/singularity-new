"use client"

import * as React from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Search } from "lucide-react"
import { Loader } from "@/components/ui/loader"
import dynamic from "next/dynamic"

const StudentResultsDialog = dynamic(
  () => import("@/components/ui/student-results-dialog").then((mod) => mod.StudentResultsDialog),
  {
    ssr: false,
    loading: () => <div className="p-4 text-sm text-muted-foreground">Loading results chart...</div>,
  }
)

export type Subject = {
  id: string
  subject: string
  code: string
  type: string
  internal: string
  external: string
  resultId: string
}

export type CarryOver = {
  session: string
  sem: string
  cop: string
} | string[]

export type StudentResult = {
  id: string
  rollNo: string
  enrollmentNo: string
  fullName: string
  blocked: boolean
  fatherName: string
  course: string
  branch: string
  year: number
  SGPA: {
    sem1?: number
    sem2?: number
    sem3?: number
    sem4?: number
    sem5?: number
    sem6?: number
    sem7?: number
    sem8?: number
  }
  CarryOvers: CarryOver[]
  divison: string
  cgpa: string
  instituteName: string
  latestResultStatus: string
  totalMarksObtained: number
  latestCOP: string
  Subjects: Subject[]
}

export type Student = {
  id: string
  fullName: string
  rollNo: string
  branch: string
  year: number
  rank: number // Calculated from backend sort order
}

type ApiResponse = {
  success: boolean
  data: Omit<Student, 'rank'>[]
  count: number
}

type ResultApiResponse = {
  success: boolean
  data: StudentResult
}

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || ""

export function StudentAccordion() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedStudentId, setSelectedStudentId] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedYear, setSelectedYear] = React.useState<string>("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [studentsData, setStudentsData] = React.useState<Student[]>([])
  const [selectedResult, setSelectedResult] = React.useState<StudentResult | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingResult, setIsLoadingResult] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false)
  const [pendingStudent, setPendingStudent] = React.useState<{ rollNo: string; fullName: string } | null>(null)
  const itemsPerPage = 10

  // Fetch students cache on mount with localStorage caching
  React.useEffect(() => {
    const CACHE_KEY = 'students_data_cache'
    const CACHE_DURATION = 360 * 60 * 60 * 1000 // 1 hour in milliseconds

    const fetchStudents = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Try to get from localStorage first
        const cachedData = localStorage.getItem(CACHE_KEY)
        if (cachedData) {
          try {
            const { data, timestamp } = JSON.parse(cachedData)
            const now = Date.now()
            
            // Check if cache is still valid (within 1 hour)
            if (now - timestamp < CACHE_DURATION) {
              console.log('Using cached student data from localStorage')
              setStudentsData(data)
              setIsLoading(false)
              return
            } else {
              console.log('Cache expired, fetching fresh data')
            }
          } catch (parseError) {
            console.error('Error parsing cached data:', parseError)
            localStorage.removeItem(CACHE_KEY)
          }
        }

        // Fetch from server if no cache or cache expired
        const response = await fetch(`${API_BASE_URL}/api/result/cache`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch students")
        }
        
        const data: ApiResponse = await response.json()
        
        if (data.success) {
          // Store students without ranks - ranks will be calculated dynamically based on filters
          const studentsWithRank = data.data.map((student) => ({
            ...student,
            rank: 0 // Placeholder, will be recalculated by filter logic
          }))
          setStudentsData(studentsWithRank)

          // Store in localStorage with timestamp
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              data: studentsWithRank,
              timestamp: Date.now()
            }))
            console.log('Cached student data to localStorage')
          } catch (storageError) {
            console.error('Error storing to localStorage:', storageError)
          }
        } else {
          throw new Error("API returned unsuccessful response")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        console.error("Error fetching students:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudents()
  }, [])

  const handleViewResults = (e: React.MouseEvent, rollNo: string, fullName: string) => {
    e.stopPropagation()
    setPendingStudent({ rollNo, fullName })
    setIsConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (!pendingStudent) return
    setIsLoadingResult(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/result/by-rollno?rollNo=${pendingStudent.rollNo}`)

      if (!response.ok) {
        throw new Error("Failed to fetch student result")
      }

      const data: ResultApiResponse = await response.json()

      if (data.success) {
        setSelectedResult(data.data)
        setIsConfirmOpen(false)
        setIsOpen(true)
      } else {
        throw new Error("Failed to load result")
      }
    } catch (err) {
      console.error("Error fetching result:", err)
      setSelectedResult(null)
    } finally {
      setIsLoadingResult(false)
    }
  }

  // Get unique years for filter
  const years = React.useMemo(() => 
    Array.from(new Set(studentsData.map(s => s.year))).sort(),
    [studentsData]
  )

  // Function to format year display
  const formatYear = (year: number): string => {
    // If year is a typical year number (1-4), format as ordinal
    if (year >= 1 && year <= 4) {
      const ordinals = ['1st', '2nd', '3rd', '4th']
      return `${ordinals[year - 1]} Year`
    }
    // If year appears to be a batch year (2020+), format as batch
    if (year >= 2020) {
      return `Batch ${year}`
    }
    // Fallback for any other values
    return `Year ${year}`
  }

  // Function to shorten branch names
  const shortenBranchName = (branch: string): string => {
    const branchMap: { [key: string]: string } = {
      'CSE DATA SCIENCE': 'CSE-DS',
      'COMPUTER SCIENCE AND ENGINEERING (DATA SCIENCE)': 'CSE-DS',
      'COMPUTER SCIENCE AND ENGINEERING': 'CSE',
      'COMPUTER SCIENCE AND ENGINEERINGDATA SCIENCE': 'CSE-DS',
      'COMPUTER SCIENCE AND ENGINEERINGARTIFICIAL INTELLIGENCE & MACHINE LEARNING': 'CSE-AIML',
      'COMPUTER SCIENCE AND ENGINEERING ARTIFICIAL INTELLIGENCE': 'CSE-AI',
      'COMPUTER SCIENCE AND ENGINEERINGINTERNET OF THINGS': 'CSE-IoT',
      'INFORMATION TECHNOLOGY': 'IT',
      'ELECTRONICS AND COMMUNICATION ENGINEERING': 'ECE',
      'ELECTRICAL ENGINEERING': 'EE',
      'MECHANICAL ENGINEERING': 'ME',
      'CIVIL ENGINEERING': 'CE',
      'COMPUTER SCIENCE': 'CS',
      'BIOTECHNOLOGY': 'BT',
      'COMPUTER SCIENCE AND INFORMATION TECHNOLOGY': 'CSIT',
    }
    
    // Check if exact match exists
    if (branchMap[branch.toUpperCase()]) {
      return branchMap[branch.toUpperCase()]
    }
    
    // If branch is too long, try to create abbreviation
    if (branch.length > 30) {
      return branch
        .split(' ')
        .filter(word => word.length > 2) // Filter out small words like 'AND'
        .map(word => word[0])
        .join('')
        .toUpperCase()
    }
    
    return branch
  }

  // Assign ranks based on year filter only (ranks stay stable during search)
  const rankedByYear = React.useMemo(() => {
    const filtered = studentsData.filter((student) =>
      selectedYear === "all" || student.year === parseInt(selectedYear)
    )
    return filtered.map((student, index) => ({
      ...student,
      rank: index + 1
    }))
  }, [selectedYear, studentsData])

  // Further filter by search term without changing ranks
  const filteredStudents = React.useMemo(() => {
    if (searchTerm === "") return rankedByYear
    const lower = searchTerm.toLowerCase()
    return rankedByYear.filter((student) =>
      student.fullName.toLowerCase().includes(lower) ||
      student.rollNo.toLowerCase().includes(lower)
    )
  }, [searchTerm, rankedByYear])

  // Calculate pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedYear])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="md" intent="primary" />
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-12 border border-dashed border-destructive rounded-lg bg-destructive/5">
        <p className="text-destructive font-semibold mb-2">Error loading students</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Search and Filter Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          {/* Year Filter */}
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full sm:w-[220px] h-16 py-2">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {formatYear(year)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          Showing {paginatedStudents.length} of {filteredStudents.length} students
          {filteredStudents.length !== studentsData.length && ` (filtered from ${studentsData.length} total)`}
          {" • Sorted by highest semester SGPA"}
        </div>
      </div>

      {/* Students Accordion */}
      <Accordion type="single" collapsible className="w-full space-y-4">
        {paginatedStudents.length > 0 ? (
          paginatedStudents.map((student) => {
            return (
              <AccordionItem key={student.id} value={student.id} className="border border-border rounded-lg shadow-sm border-b!">
                <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 transition-colors rounded-t-lg data-[state=open]:border-b data-[state=closed]:rounded-b-lg">
                  <div className="flex items-center justify-between w-full pr-2">
                    <p className="font-semibold text-lg">{student.fullName}</p>
                    <span className="text-sm text-white font-medium">Rank: {student.rank}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4 bg-muted/30 rounded-b-lg">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Roll Number</p>
                        <p className="font-medium text-foreground">{student.rollNo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Branch</p>
                        <p className="font-medium text-foreground">{shortenBranchName(student.branch)}</p>
                      </div>
                    </div>
                    <Button onClick={(e) => handleViewResults(e, student.rollNo, student.fullName)} className="w-full sm:w-auto">
                      View Results
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })
        ) : (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">No students found matching your search criteria.</p>
          </div>
        )}
      </Accordion>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage > 1) setCurrentPage(prev => prev - 1)
                }}
                aria-disabled={currentPage === 1}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              // Show first page, last page, current page, and pages around current
              const showPage = 
                pageNum === 1 || 
                pageNum === totalPages || 
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              
              // Show ellipsis before
              if (pageNum === currentPage - 2 && currentPage > 3) {
                return (
                  <PaginationItem key={`ellipsis-before-${pageNum}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }
              
              // Show ellipsis after
              if (pageNum === currentPage + 2 && currentPage < totalPages - 2) {
                return (
                  <PaginationItem key={`ellipsis-after-${pageNum}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }
              
              if (!showPage) return null

              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentPage(pageNum)
                    }}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            })}
            
            <PaginationItem>
              <PaginationNext 
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage < totalPages) setCurrentPage(prev => prev + 1)
                }}
                aria-disabled={currentPage === totalPages}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={(open) => { if (!isLoadingResult) setIsConfirmOpen(open) }}>
        <DialogContent showCloseButton={!isLoadingResult}>
          <DialogHeader>
            <DialogTitle>View Student Results</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to fetch results for{" "}
            <span className="font-medium text-foreground">{pendingStudent?.fullName}</span>?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isLoadingResult}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isLoadingResult}>
              {isLoadingResult ? (
                <span className="flex items-center gap-2">
                  <Loader size="sm" intent="current" />
                  Fetching...
                </span>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {selectedResult ? (
          <StudentResultsDialog results={selectedResult} />
        ) : null}
      </Dialog>
    </>
  )
}
