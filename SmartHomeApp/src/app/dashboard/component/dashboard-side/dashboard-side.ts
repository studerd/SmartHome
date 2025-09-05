import {Component, computed, Input, signal} from '@angular/core';
import {DatePipe} from '@angular/common';

interface CalendarDay {
  date: Date;
  label: number;
  isToday: boolean;
  isCurrentMonth: boolean;
}

@Component({
  selector: 'app-dashboard-side',
  imports: [DatePipe],
  templateUrl: './dashboard-side.html',
  standalone: true,
  styleUrl: './dashboard-side.scss'
})
export class DashboardSide {
// Provide a sanitized URL as needed in a real app (DomSanitizer). Here we keep it simple for the example.
  spotifySrc: any = 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator';


  private today = new Date();
  current = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];


  monthTitle = computed(() => this.current().toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'}));
  days = computed<CalendarDay[]>(() => this.buildMonth(this.current()));


  prevMonth() {
    const d = this.current();
    this.current.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth() {
    const d = this.current();
    this.current.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }


  private buildMonth(firstOfMonth: Date): CalendarDay[] {
    const year = firstOfMonth.getFullYear();
    const month = firstOfMonth.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const startWeekday = (start.getDay() + 6) % 7; // Lundi=0


    const days: CalendarDay[] = [];
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push(this.asCalDay(d, false));
    }
    for (let d = 1; d <= end.getDate(); d++) {
      days.push(this.asCalDay(new Date(year, month, d), true));
    }
    while (days.length % 7 !== 0) {
      const last = days[days.length - 1].date;
      const next = new Date(last);
      next.setDate(next.getDate() + 1);
      days.push(this.asCalDay(next, false));
    }
    return days;
  }

  private asCalDay(d: Date, isCurrentMonth: boolean): CalendarDay {
    const t = new Date();
    const isToday = d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
    return {date: d, label: d.getDate(), isToday, isCurrentMonth};
  }
}
