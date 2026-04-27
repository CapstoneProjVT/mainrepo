'use client'

import { KeyboardEvent, useEffect, useRef, useState } from 'react'
import { api } from '../../lib/api'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'

export default function Profile() {
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [interests, setInterests] = useState('')
  const [locations, setLocations] = useState('')
  const [gradYear, setGradYear] = useState('')
  const [hasResume, setHasResume] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  useEffect(() => {
    api.getProfile().then((profile) => {
      setSkills(profile.skills || [])
      setInterests(profile.interests || '')
      setLocations((profile.locations || []).join(', '))
      setGradYear(profile.grad_year ? String(profile.grad_year) : '')
      setHasResume(profile.has_resume ?? false)
    })
  }, [])

  const addSkill = () => {
    const val = skillInput.trim()
    if (!val) return
    setSkills((prev) => [...prev, val])
    setSkillInput('')
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await api.uploadResume(file)
      setHasResume(true)
      if (result.autofilled) {
        const profile = await api.getProfile()
        setSkills(profile.skills || [])
        setInterests(profile.interests || '')
        setLocations((profile.locations || []).join(', '))
        setGradYear(profile.grad_year ? String(profile.grad_year) : '')
        toast('Resume uploaded — profile auto-filled from your resume')
      } else {
        toast('Resume uploaded')
      }
    } catch (err: any) {
      toast(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleResumeDelete = async () => {
    await api.deleteResume()
    setHasResume(false)
    toast('Resume removed')
  }

  return (
    <Card className='space-y-4'>
      <div>
        <h1>Profile settings</h1>
        <p className='text-sm text-muted-foreground'>Keep this profile current to improve matching quality.</p>
      </div>

      <div>
        <p className='mb-2 text-sm font-medium'>Skills</p>
        <div className='mb-2 flex flex-wrap gap-2'>
          {skills.map((skill, index) => (
            <Badge key={`${skill}-${index}`} className='gap-2'>
              {skill}
              <button aria-label='remove skill' onClick={() => setSkills((prev) => prev.filter((_, i) => i !== index))}>×</button>
            </Badge>
          ))}
        </div>
        <Input
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
          placeholder='Add skill and press Enter'
        />
      </div>

      <div>
        <p className='mb-2 text-sm font-medium'>Interests</p>
        <Textarea value={interests} onChange={(e) => setInterests(e.target.value)} />
      </div>

      <div className='grid gap-3 md:grid-cols-2'>
        <div>
          <p className='mb-2 text-sm font-medium'>Locations</p>
          <Input value={locations} onChange={(e) => setLocations(e.target.value)} />
        </div>
        <div>
          <p className='mb-2 text-sm font-medium'>Graduation year</p>
          <Input value={gradYear} onChange={(e) => setGradYear(e.target.value)} />
        </div>
      </div>

      <div>
        <p className='mb-2 text-sm font-medium'>Resume (PDF)</p>
        <p className='mb-2 text-xs text-muted-foreground'>Uploading your resume improves match scores by giving the AI more context about your experience.</p>
        {hasResume ? (
          <div className='flex items-center gap-3'>
            <span className='text-sm text-green-600'>Resume uploaded</span>
            <Button variant='outline' onClick={() => fileInputRef.current?.click()} disabled={uploading}>Replace</Button>
            <Button variant='outline' onClick={handleResumeDelete}>Remove</Button>
          </div>
        ) : (
          <Button variant='outline' onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload PDF'}
          </Button>
        )}
        <input ref={fileInputRef} type='file' accept='.pdf' className='hidden' onChange={handleResumeUpload} />
      </div>

      <Button onClick={async () => {
        await api.updateProfile({ skills, interests, locations: locations.split(',').map((v) => v.trim()).filter(Boolean), grad_year: gradYear ? Number(gradYear) : null })
        toast('Profile saved')
      }}>
        Save profile
      </Button>
    </Card>
  )
}
