import { HTMLAttributes, ReactNode } from 'react'
import { Button } from './Button'
import { cn } from '../../lib/utils'

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cn('min-w-full text-sm', className)} {...props} />
}

export function DataTable({ headers, rows, page, totalPages, onNext, onPrev }: { headers: string[]; rows: ReactNode[][]; page: number; totalPages: number; onNext: () => void; onPrev: () => void }) {
  return (
    <div className='overflow-hidden rounded-xl border'>
      <div className='overflow-auto'>
        <Table>
          <thead className='bg-muted/70'>
            <tr>{headers.map((header) => <th key={header} className='px-3 py-2 text-left font-semibold'>{header}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className='border-t'>
                {row.map((cell, cellIdx) => <td key={cellIdx} className='px-3 py-2 align-top'>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      <div className='flex items-center justify-end gap-2 border-t bg-card px-3 py-2'>
        <p className='text-xs text-muted-foreground'>Page {page} / {totalPages}</p>
        <Button variant='secondary' size='sm' onClick={onPrev} disabled={page <= 1}>Previous</Button>
        <Button variant='secondary' size='sm' onClick={onNext} disabled={page >= totalPages}>Next</Button>
      </div>
    </div>
  )
}
