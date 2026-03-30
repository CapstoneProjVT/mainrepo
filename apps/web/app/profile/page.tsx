'use client'

import { KeyboardEvent, useEffect, useState } from 'react'
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
  const toast = useToast()

  useEffect(() => { api.getProfile().then((profile) => { setSkills(profile.skills || []); setInterests(profile.interests || ''); setLocations((profile.locations || []).join(', ')); setGradYear(profile.grad_year ? String(profile.grad_year) : '') }) }, [])
  const addSkill = () => { const val = skillInput.trim(); if (!val) return; setSkills((prev) => [...prev, val]); setSkillInput('') }

  return (
    <Card className='space-y-4'>
      <div><h1>Profile settings</h1><p className='text-sm text-muted-foreground'>Keep this profile current to improve matching quality.</p></div>
      <div><p className='mb-2 text-sm font-medium'>Skills</p><div className='mb-2 flex flex-wrap gap-2'>{skills.map((skill, index) => <Badge key={`${skill}-${index}`} className='gap-2'>{skill}<button aria-label='remove skill' onClick={() => setSkills((prev) => prev.filter((_, i) => i !== index))}>×</button></Badge>)}</div><Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder='Add skill and press Enter' /></div>
      <div><p className='mb-2 text-sm font-medium'>Interests</p><Textarea value={interests} onChange={(e) => setInterests(e.target.value)} /></div>
      <div className='grid gap-3 md:grid-cols-2'><div><p className='mb-2 text-sm font-medium'>Locations</p><Input value={locations} onChange={(e) => setLocations(e.target.value)} /></div><div><p className='mb-2 text-sm font-medium'>Graduation year</p><Input value={gradYear} onChange={(e) => setGradYear(e.target.value)} /></div></div>
      <Button onClick={async () => { await api.updateProfile({ skills, interests, locations: locations.split(',').map((v) => v.trim()).filter(Boolean), grad_year: gradYear ? Number(gradYear) : null }); toast('Profile saved') }}>Save profile</Button>
    </Card>
  )
}
