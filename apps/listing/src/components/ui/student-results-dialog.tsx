import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { StudentResult } from "@/components/dashboard/student-accordian"

interface StudentResultsDialogProps {
  results: StudentResult
}

export function StudentResultsDialog({ results }: StudentResultsDialogProps) {
  // Check for backlogs - handle both formats of CarryOvers
  const hasBacklogs = results.CarryOvers.some((c) => {
    if (Array.isArray(c)) {
      return c[0] !== "No Backlogs"
    }
    // If it's an object with session, sem, cop properties
    return true
  })
  const statusColor = hasBacklogs ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
  
  // Calculate average SGPA
  const sgpaValues = Object.values(results.SGPA).filter((v) => v !== undefined) as number[]
  const avgSGPA = sgpaValues.length > 0 
    ? (sgpaValues.reduce((a, b) => a + b, 0) / sgpaValues.length).toFixed(2)
    : "N/A"

  // Extract failed subject codes from latest carryover
  const getFailedSubjectCodes = (): string[] => {
    const failedCodes: string[] = []
    
    results.CarryOvers.forEach((carryOver) => {
      if (Array.isArray(carryOver)) {
        // Skip "No Backlogs" entries
        if (carryOver[0] === "No Backlogs") return
      } else if (typeof carryOver === "object" && "cop" in carryOver) {
        // Extract codes from "COP : BAS302,BCE301,BCE302"
        const copString = carryOver.cop
        const match = copString.match(/COP\s*:\s*(.+)/)
        if (match && match[1]) {
          const codes = match[1].split(",").map((code) => code.trim()).filter(Boolean)
          failedCodes.push(...codes)
        }
      }
    })
    
    return [...new Set(failedCodes)] // Remove duplicates
  }

  const failedSubjectCodes = getFailedSubjectCodes()
  
  // Check if a subject has failed
  const isSubjectFailed = (subjectCode: string): boolean => {
    return failedSubjectCodes.includes(subjectCode)
  }

  return (
    <DialogContent className="w-[95dvw] h-[90dvh] sm:w-[90dvw] sm:max-w-[1400px] md:h-auto md:max-h-[90dvh] flex flex-col p-0">
      <DialogHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b shrink-0">
        <DialogTitle className="text-base md:text-lg">Student Results - {results.fullName}</DialogTitle>
      </DialogHeader>

      <div className="overflow-y-auto px-4 md:px-6 py-3 md:py-4 flex-1 scrollbar-thin">
        <div className="space-y-4 md:space-y-6 pb-4">
          {/* Student Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div>
            <p className="text-xs md:text-sm text-muted-foreground">Roll Number</p>
            <p className="font-medium text-sm md:text-base">{results.rollNo}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-muted-foreground">Enrollment No</p>
            <p className="font-medium text-sm md:text-base break-all">{results.enrollmentNo}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-muted-foreground">Branch</p>
            <p className="font-medium text-sm md:text-base">{results.branch}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-muted-foreground">Course</p>
            <p className="font-medium text-sm md:text-base">{results.course}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-muted-foreground">Year</p>
            <p className="font-medium text-sm md:text-base">{results.year}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-muted-foreground">Father's Name</p>
            <p className="font-medium text-sm md:text-base">{results.fatherName}</p>
          </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-4">
          <Card>
            <CardHeader className="pb-1 md:pb-2 px-3 md:px-4 pt-3 md:pt-4">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Marks</CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-4 pb-3 md:pb-4">
              <p className="text-xl md:text-2xl font-bold">{results.totalMarksObtained}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 md:pb-2 px-3 md:px-4 pt-3 md:pt-4">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Avg SGPA</CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-4 pb-3 md:pb-4">
              <p className="text-xl md:text-2xl font-bold">{avgSGPA}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 md:pb-2 px-3 md:px-4 pt-3 md:pt-4">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-4 pb-3 md:pb-4">
              <Badge className={statusColor}>
                {hasBacklogs ? "Backlogs" : "Clear"}
              </Badge>
            </CardContent>
          </Card>
          </div>

          {/* SGPA per Semester */}
          <div>
            <h3 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">Semester-wise SGPA</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5 md:gap-2">
            {Object.entries(results.SGPA).map(([sem, sgpa]) => (
              sgpa && (
                <Card key={sem}>
                  <CardHeader className="pb-1 pt-2 md:pt-3 px-2 md:px-4">
                    <CardTitle className="text-xs text-center text-muted-foreground">
                      {sem.replace('sem', 'S')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2 md:pb-3 px-2 md:px-4">
                    <p className="text-center font-bold text-sm md:text-base">{sgpa}</p>
                  </CardContent>
                </Card>
              )
            ))}
            </div>
          </div>

          {/* Subject Results Table */}
          <div>
            <h3 className="font-semibold mb-3">Subject Results</h3>
            
            {/* Desktop View - Table */}
            <div className="hidden md:block border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Subject</th>
                      <th className="px-4 py-2 text-center font-medium">Code</th>
                      <th className="px-4 py-2 text-center font-medium">Type</th>
                      <th className="px-4 py-2 text-center font-medium">Internal</th>
                      <th className="px-4 py-2 text-center font-medium">External</th>
                      <th className="px-4 py-2 text-center font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.Subjects.map((subject) => {
                      const internal = parseInt(subject.internal) || 0
                      const external = parseInt(subject.external) || 0
                      const total = internal + external
                      const isFailed = isSubjectFailed(subject.code)
                      
                      return (
                        <tr key={subject.id} className="border-t hover:bg-muted/50">
                          <td className={`px-4 py-2 ${isFailed ? "text-red-600 font-semibold" : ""}`}>
                            {subject.subject}
                          </td>
                          <td className={`px-4 py-2 text-center ${isFailed ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                            {subject.code}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <Badge variant="outline" className="text-xs">{subject.type}</Badge>
                          </td>
                          <td className={`px-4 py-2 text-center font-medium ${isFailed ? "text-red-600" : ""}`}>
                            {subject.internal || "-"}
                          </td>
                          <td className={`px-4 py-2 text-center font-medium ${isFailed ? "text-red-600" : ""}`}>
                            {subject.external || "-"}
                          </td>
                          <td className={`px-4 py-2 text-center font-bold ${isFailed ? "text-red-600" : ""}`}>
                            {total > 0 ? total : "-"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin">
              {results.Subjects.map((subject) => {
                const internal = parseInt(subject.internal) || 0
                const external = parseInt(subject.external) || 0
                const total = internal + external
                const isFailed = isSubjectFailed(subject.code)
                
                return (
                  <Card key={subject.id} className={isFailed ? "border-red-200 bg-red-50/30" : ""}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className={`font-semibold text-sm ${isFailed ? "text-red-600" : ""}`}>
                              {subject.subject}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs ${isFailed ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                                {subject.code}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {subject.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Internal</p>
                            <p className={`font-semibold ${isFailed ? "text-red-600" : ""}`}>
                              {subject.internal || "-"}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">External</p>
                            <p className={`font-semibold ${isFailed ? "text-red-600" : ""}`}>
                              {subject.external || "-"}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Total</p>
                            <p className={`font-bold ${isFailed ? "text-red-600" : ""}`}>
                              {total > 0 ? total : "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Institution */}
          <div className="text-sm text-muted-foreground">
            <p className="font-medium">{results.instituteName}</p>
          </div>
        </div>
      </div>
    </DialogContent>
  )
}
