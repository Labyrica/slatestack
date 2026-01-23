import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Entry } from '@/types/entry'
import type { Collection } from '@/types/collection'
import { Edit, Trash2, FileText } from 'lucide-react'
import type { UseMutationResult } from '@tanstack/react-query'

interface EntryListProps {
  entries: Entry[]
  collection: Collection
  isLoading: boolean
  onEdit: (entry: Entry) => void
  onDelete: (id: string) => void
  deleteConfirm: string | null
  setDeleteConfirm: (id: string | null) => void
  deleteMutation: UseMutationResult<void, Error, string>
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function EntryList({
  entries,
  collection,
  isLoading,
  onEdit,
  onDelete,
  deleteConfirm,
  setDeleteConfirm,
  deleteMutation,
  currentPage,
  totalPages,
  onPageChange,
}: EntryListProps) {
  // Get display title from entry data
  const getEntryTitle = (entry: Entry): string => {
    // Look for common title fields
    const titleFields = ['title', 'name', 'heading', 'label']
    for (const field of titleFields) {
      if (entry.data[field]) {
        return String(entry.data[field])
      }
    }
    // Fallback to first field value or slug
    const firstValue = Object.values(entry.data)[0]
    return firstValue ? String(firstValue) : entry.slug
  }

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-12">
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground">Loading entries...</p>
        </div>
      </Card>
    )
  }

  // Empty state
  if (entries.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No entries found</h3>
        <p className="mt-2 text-muted-foreground">
          {collection.name} has no entries yet. Create your first entry to get started.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">
                  {getEntryTitle(entry)}
                  <div className="text-xs text-muted-foreground">
                    /{entry.slug}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={entry.status === 'published' ? 'success' : 'warning'}
                  >
                    {entry.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(entry.updatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(entry)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {deleteConfirm === entry.id ? (
                      <>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(entry.id)}
                          disabled={deleteMutation.isPending}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm(null)}
                          disabled={deleteMutation.isPending}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(entry.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  )
}
