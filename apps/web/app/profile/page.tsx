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
  const [resumeLoading, setResumeLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  useEffect(() => {
    api.getProfile().then((profile) => {
      setSkills(profile.skills || [])
      setInterests(profile.interests || '')
      setLocations((profile.locations || []).join(', '))
      setGradYear(profile.grad_year ? String(profile.grad_year) : '')
      setHasResume(profile.has_resume || false)
    })
  }, [])

  const addSkill = () => { const val = skillInput.trim(); if (!val) return; setSkills((prev) => [...prev, val]); setSkillInput('') }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setResumeLoading(true)
    try {
      await api.uploadResume(file)
      setHasResume(true)
      toast('Resume uploaded — AI features will now use your resume')
    } catch (err: any) {
      toast(err.message || 'Failed to upload resume')
    } finally {
      setResumeLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleResumeDelete = async () => {
    setResumeLoading(true)
    try {
      await api.deleteResume()
      setHasResume(false)
      toast('Resume removed')
    } catch {
      toast('Failed to remove resume')
    } finally {
      setResumeLoading(false)
    }
  }

  return (
    <div className='space-y-4'>
      <Card className='space-y-4'>
        <div><h1>Profile settings</h1><p className='text-sm text-muted-foreground'>Keep this profile current to improve matching quality.</p></div>
        <div><p className='mb-2 text-sm font-medium'>Skills</p><div className='mb-2 flex flex-wrap gap-2'>{skills.map((skill, index) => <Badge key={`${skill}-${index}`} className='gap-2'>{skill}<button aria-label='remove skill' onClick={() => setSkills((prev) => prev.filter((_, i) => i !== index))}>×</button></Badge>)}</div><Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder='Add skill and press Enter' /></div>
        <div><p className='mb-2 text-sm font-medium'>Interests</p><Textarea value={interests} onChange={(e) => setInterests(e.target.value)} /></div>
        <div className='grid gap-3 md:grid-cols-2'><div><p className='mb-2 text-sm font-medium'>Locations</p><Input value={locations} onChange={(e) => setLocations(e.target.value)} /></div><div><p className='mb-2 text-sm font-medium'>Graduation year</p><Input value={gradYear} onChange={(e) => setGradYear(e.target.value)} /></div></div>
        <Button onClick={async () => { await api.updateProfile({ skills, interests, locations: locations.split(',').map((v) => v.trim()).filter(Boolean), grad_year: gradYear ? Number(gradYear) : null }); toast('Profile saved') }}>Save profile</Button>
      </Card>

      <Card className='space-y-4'>
        <div>
          <h2 className='text-lg font-semibold'>Resume</h2>
          <p className='text-sm text-muted-foreground'>Upload your resume to improve AI match scores, cover letters, and interview prep.</p>
        </div>

        {hasResume ? (
          <div className='flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3'>
            <span className='text-primary text-lg'>📄</span>
            <div className='flex-1'>
              <p className='text-sm font-medium text-primary'>Resume uploaded</p>
              <p className='text-xs text-muted-foreground'>AI features are using your resume</p>
            </div>
            <div className='flex gap-2'>
              <Button size='sm' variant='outline' onClick={() => fileInputRef.current?.click()} disabled={resumeLoading}>
                Replace
              </Button>
              <Button size='sm' variant='danger' onClick={handleResumeDelete} disabled={resumeLoading}>
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div
            className='flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors'
            onClick={() => fileInputRef.current?.click()}
          >
            <span className='text-3xl'>📄</span>
            <div>
              <p className='text-sm font-medium'>Click to upload your resume</p>
              <p className='text-xs text-muted-foreground mt-1'>PDF only · max 5 MB</p>
            </div>
            <Button size='sm' variant='outline' disabled={resumeLoading}>
              {resumeLoading ? 'Uploading…' : 'Choose PDF'}
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type='file'
          accept='.pdf,application/pdf'
          className='hidden'
          onChange={handleResumeUpload}
        />
      </Card>
    </div>
  )
}
