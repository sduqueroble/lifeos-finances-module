'use client'

import { useNow, useToday } from '@/lib/today/use-today'
import { AppRail, Atmosphere, MobileTabBar, MobileTopBar } from './app-chrome'
import { CheckInPanel } from './checkin-panel'
import { HabitsPanel } from './habits-panel'
import { Hero } from './hero'
import { ScenarioSwitcher } from './scenario-switcher'
import { SchedulePanel } from './schedule-panel'
import { TasksPanel } from './tasks-panel'
import { TodaySkeleton } from './today-skeleton'
import { WeekPanel } from './week-panel'

export function TodayPage() {
  const now = useNow()
  const { scenario, setScenario, data, loading, actions } = useToday()
  const ready = now !== null && data !== null && !loading

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <Atmosphere />
      <AppRail />
      <MobileTopBar />
      <div className="relative lg:pl-[104px]">
        <main id="main" className="mx-auto max-w-[1280px] px-5 pb-32 pt-6 sm:px-8 lg:px-14 lg:pb-24 lg:pt-10">
          <div className="mb-10 flex items-center justify-between gap-4 lg:mb-14">
            <p className="eyebrow hidden lg:block">Today</p>
            <ScenarioSwitcher value={scenario} onChange={setScenario} />
          </div>

          {ready ? (
            <div key={scenario}>
              <Hero data={data} now={now} />

              <div className="mt-14 flex flex-col gap-10 lg:mt-20 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-10 xl:gap-x-14">
                <div className="contents lg:col-span-7 lg:flex lg:flex-col lg:gap-8">
                  <TasksPanel tasks={data.tasks} actions={actions} className="order-1 lg:order-none" />
                  <CheckInPanel checkIn={data.checkIn} actions={actions} className="order-4 lg:order-none" />
                  <WeekPanel
                    week={data.week}
                    habits={data.habits}
                    checkIn={data.checkIn}
                    now={now}
                    className="order-5 lg:order-none lg:pt-4"
                  />
                </div>
                <div className="contents lg:col-span-5 lg:flex lg:flex-col lg:gap-12">
                  <SchedulePanel events={data.events} now={now} actions={actions} className="order-2 lg:order-none" />
                  <HabitsPanel habits={data.habits} actions={actions} className="order-3 lg:order-none" />
                </div>
              </div>
            </div>
          ) : (
            <TodaySkeleton />
          )}
        </main>
      </div>
      <MobileTabBar />
    </div>
  )
}
