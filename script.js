document.addEventListener('DOMContentLoaded', async function () {
  const calendarEl = document.getElementById('calendar');
  const loadingOverlay = document.getElementById('loading-overlay'); // Get the loading overlay

  if (loadingOverlay) { // Show loading overlay
    loadingOverlay.style.display = 'block';
  }

  try { // Wrap the fetch and calendar rendering in a try block
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

      // Format the selected time to be more readable
      const options = { hour: 'numeric', minute: 'numeric', hour12: true };
      const startTime = info.start.toLocaleTimeString('en-US', options);
      const endTime = info.end.toLocaleTimeString('en-US', options);
      const selectedDateStr = info.start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      const timeDisplayString = `Selected Slot: ${selectedDateStr}, ${startTime} - ${endTime}`;
      document.getElementById('selected-time-display').innerHTML = timeDisplayString;

      document.getElementById('booking-form').style.display = 'block';
      document.getElementById('selected-date').value = info.startStr;
    }
  });

  calendar.render();
  } catch (error) { // Catch any errors during fetch or calendar setup
    console.error("Error loading calendar or busy times:", error);
    if (calendarEl) {
        calendarEl.innerHTML = "<p>Could not load appointment calendar. Please try refreshing the page.</p>";
    }
  } finally { // Hide loading overlay regardless of success or failure
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }

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
            const res = await fetch('http://localhost:3000/reviews'); // Adjust port if needed
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
                    const res = await fetch('http://localhost:3000/reviews', {
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
