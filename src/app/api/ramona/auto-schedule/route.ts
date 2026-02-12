import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ScheduleConfig {
  brandId: string;
  contentIds: string[]; // IDs of contents to schedule (or 'all_approved' for all approved contents)
  dateRange: {
    start: string; // ISO date
    end: string; // ISO date
  };
  frequency: {
    instagram?: number; // posts per week
    facebook?: number;
    linkedin?: number;
    twitter?: number;
    tiktok?: number;
  };
  preferredTimes: ('morning' | 'afternoon' | 'evening' | 'night')[];
  excludeWeekends?: boolean;
}

// Best posting times by time slot
const TIME_SLOTS: Record<string, { start: number; end: number }> = {
  morning: { start: 8, end: 11 },
  afternoon: { start: 12, end: 14 },
  evening: { start: 18, end: 21 },
  night: { start: 21, end: 23 },
};

// Default posting frequency if not specified
const DEFAULT_FREQUENCY: Record<string, number> = {
  instagram: 4,
  facebook: 3,
  linkedin: 2,
  twitter: 7,
  tiktok: 5,
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const config = body as ScheduleConfig;

    if (!config.brandId || !config.dateRange?.start || !config.dateRange?.end) {
      return NextResponse.json(
        { error: 'Missing required fields: brandId, dateRange.start, dateRange.end' },
        { status: 400 }
      );
    }

    // Verify brand ownership
    const { data: brand, error: brandError } = await supabase
      .from('rm_brands')
      .select('id')
      .eq('id', config.brandId)
      .eq('user_id', user.id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Get contents to schedule
    let contentsQuery = supabase
      .from('rm_contents')
      .select('*')
      .eq('brand_id', config.brandId)
      .is('scheduled_for', null); // Only unscheduled content

    if (config.contentIds && config.contentIds.length > 0 && !config.contentIds.includes('all_approved')) {
      contentsQuery = contentsQuery.in('id', config.contentIds);
    } else {
      // Get all approved content
      contentsQuery = contentsQuery.eq('status', 'approved');
    }

    const { data: contents, error: contentsError } = await contentsQuery;

    if (contentsError) {
      return NextResponse.json({ error: 'Failed to fetch contents' }, { status: 500 });
    }

    if (!contents || contents.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No unscheduled approved content found',
        scheduled: 0,
      });
    }

    // Generate schedule
    const startDate = new Date(config.dateRange.start);
    const endDate = new Date(config.dateRange.end);
    const preferredTimes = config.preferredTimes?.length > 0 ? config.preferredTimes : ['morning', 'evening'];

    // Group contents by platform
    const contentsByPlatform: Record<string, typeof contents> = {};
    for (const content of contents) {
      const platform = content.platform || 'instagram';
      if (!contentsByPlatform[platform]) {
        contentsByPlatform[platform] = [];
      }
      contentsByPlatform[platform].push(content);
    }

    // Generate time slots for each platform
    const schedule: Array<{ contentId: string; scheduledFor: Date }> = [];

    for (const [platform, platformContents] of Object.entries(contentsByPlatform)) {
      const weeklyFrequency = config.frequency?.[platform as keyof typeof config.frequency] ?? DEFAULT_FREQUENCY[platform] ?? 3;
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalWeeks = Math.ceil(totalDays / 7);
      const totalSlots = weeklyFrequency * totalWeeks;

      // Calculate days between posts
      const daysInterval = Math.max(1, Math.floor(totalDays / Math.min(totalSlots, platformContents.length)));

      let currentDate = new Date(startDate);
      let contentIndex = 0;

      while (currentDate <= endDate && contentIndex < platformContents.length) {
        // Skip weekends if configured
        if (config.excludeWeekends && (currentDate.getDay() === 0 || currentDate.getDay() === 6)) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        // Pick a random time from preferred times
        const timeSlot = preferredTimes[Math.floor(Math.random() * preferredTimes.length)];
        const slot = TIME_SLOTS[timeSlot];
        const hour = slot.start + Math.floor(Math.random() * (slot.end - slot.start));
        const minute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, or 45 minutes

        const scheduledTime = new Date(currentDate);
        scheduledTime.setHours(hour, minute, 0, 0);

        schedule.push({
          contentId: platformContents[contentIndex].id,
          scheduledFor: scheduledTime,
        });

        contentIndex++;
        currentDate.setDate(currentDate.getDate() + daysInterval);
      }
    }

    // Sort schedule by date
    schedule.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());

    // Update contents with scheduled dates
    const updates = schedule.map(({ contentId, scheduledFor }) =>
      supabase
        .from('rm_contents')
        .update({
          scheduled_for: scheduledFor.toISOString(),
          status: 'scheduled',
        })
        .eq('id', contentId)
    );

    await Promise.all(updates);

    // Return schedule preview
    const schedulePreview = schedule.map(({ contentId, scheduledFor }) => {
      const content = contents.find((c) => c.id === contentId);
      return {
        id: contentId,
        title: content?.title,
        platform: content?.platform,
        scheduledFor: scheduledFor.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      scheduled: schedule.length,
      message: `Scheduled ${schedule.length} content pieces`,
      preview: schedulePreview.slice(0, 20), // Return first 20 for preview
    });

  } catch (error) {
    console.error('Auto-schedule API error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-schedule content' },
      { status: 500 }
    );
  }
}

// GET: Preview schedule without applying
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return NextResponse.json({ error: 'brandId required' }, { status: 400 });
    }

    // Get count of schedulable content
    const { count, error } = await supabase
      .from('rm_contents')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('status', 'approved')
      .is('scheduled_for', null);

    if (error) {
      return NextResponse.json({ error: 'Failed to count content' }, { status: 500 });
    }

    return NextResponse.json({
      availableContent: count || 0,
      canSchedule: (count || 0) > 0,
    });

  } catch (error) {
    console.error('Auto-schedule preview API error:', error);
    return NextResponse.json(
      { error: 'Failed to preview schedule' },
      { status: 500 }
    );
  }
}
