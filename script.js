document.addEventListener('DOMContentLoaded', async function () {
  const calendarEl = document.getElementById('calendar');

  const res = await fetch('https://mcintoshpowerwash.onrender.com/busy');
  const busyTimes = await res.json();

  // Convert busy slots to full-day blocked events
  const busyRanges = busyTimes.map(slot => {
    const start = new Date(slot.start);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return {
      start: start.toISOString(),
      end: end.toISOString(),
      display: 'background',
      color: '#ff9999'
    };
  });

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'timeGridWeek',
    selectable: true,
    slotMinTime: '09:00:00',
    slotMaxTime: '20:00:00',
    allDaySlot: false,
    height: 'auto',
    expandRows: true,
    weekends: true,
    dayHeaderFormat: { weekday: 'short' },
    events: busyRanges,

    select: function(info) {
      const isBlocked = busyRanges.some(busy =>
        info.start >= new Date(busy.start) && info.start < new Date(busy.end)
      );

      if (isBlocked) {
        alert("Sorry, that day is fully booked.");
        return;
      }

      document.getElementById('booking-form').style.display = 'block';
      document.getElementById('selected-date').value = info.startStr;
    }
  });

  calendar.render();

  document.getElementById('appointmentForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      date: document.getElementById('selected-date').value,
      service: document.getElementById('service').value,
      notes: document.getElementById('questions').value
    };

    const start = formData.date;
    const end = new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();

    const response = await fetch('https://mcintoshpowerwash.onrender.com/create-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: `Appointment: ${formData.name}`,
        description: `Service: ${formData.service}\nEmail: ${formData.email}\nNotes: ${formData.notes}`,
        start,
        end,
        email: formData.email,
        name: formData.name,
        service: formData.service
      })
    });

    const message = await response.text();
    alert(message);
    document.getElementById('booking-form').style.display = 'none';
  });
});
