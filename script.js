document.addEventListener('DOMContentLoaded', async function () {
  const calendarEl = document.getElementById('calendar');

  const res = await fetch('https://mcintoshpowerwash.onrender.com/busy');
  const busyTimes = await res.json();

  // 🔴 Group busy slots by date and mark full days
  const busyDays = new Set();

  busyTimes.forEach(slot => {
    const date = new Date(slot.start).toISOString().split('T')[0];
    busyDays.add(date);
  });

  const events = Array.from(busyDays).map(date => ({
    start: date,
    end: date,
    display: 'background',
    color: '#ff9999'
  }));

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
    events,
    select: function (info) {
      const clickedDate = info.start.toISOString().split('T')[0];
      if (busyDays.has(clickedDate)) {
        alert("❌ This day is fully booked.");
        calendar.unselect();
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

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('review-form');
    const reviewsList = document.getElementById('reviews-list');
    
    // Fetch and display existing reviews
    async function loadReviews() {
        try {
            const res = await fetch('https://mcintoshpowerwash.onrender.com/reviews'); // Updated URL
            const reviews = await res.json();
            reviewsList.innerHTML = '';
            reviews.reverse().forEach(review => {
                const reviewDiv = document.createElement('div');
                reviewDiv.className = 'review-item';
                reviewDiv.innerHTML = `<strong>${review.name}</strong><br><span>${review.text}</span><hr>`;
                reviewsList.appendChild(reviewDiv);
            });
        } catch (err) {
            reviewsList.innerHTML = '<em>Unable to load reviews.</em>';
        }
    }

    if(form && reviewsList) {
        loadReviews();
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('reviewer').value.trim();
            const text = document.getElementById('review-text').value.trim();
            if(name && text) {
                try {
                    const res = await fetch('https://mcintoshpowerwash.onrender.com/reviews', { // Updated URL
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, text })
                    });
                    if(res.ok) {
                        form.reset();
                        loadReviews();
                    } else {
                        alert('Failed to submit review.');
                    }
                } catch (err) {
                    alert('Error submitting review.');
                }
            }
        });
    }
});

function showLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = 'block';
}
function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = 'none';
}
