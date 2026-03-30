'use client'

import { useState } from 'react'
import { api } from '../../../lib/api'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'

export default function AdminImport() {
  const [result, setResult] = useState<any>(null)
  const [uploading, setUploading] = useState(false)

  return (
    <Card className='space-y-4'>
      <div><h1>Admin import</h1><p className='text-sm text-muted-foreground'>Seed the default dataset or upload additional opportunities.</p></div>
      <div className='grid gap-3 md:grid-cols-2'>
        <Button onClick={async () => setResult(await api.runSeed())}>Run seed import</Button>
        <Input type='file' onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setUploading(true); try { setResult(await api.importFile(file)) } finally { setUploading(false) } }} />
      </div>
      {uploading ? <p className='text-sm text-muted-foreground'>Uploading...</p> : null}
      {result ? <pre className='max-h-80 overflow-auto rounded-lg border bg-background p-3 text-xs'>{JSON.stringify(result, null, 2)}</pre> : null}
    </Card>
  )
}
