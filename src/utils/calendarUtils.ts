export const exportMealPlanToICS = (days: { date: Date; lunch: string; dinner: string }[]) => {
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//FoodHero//MealPlan//SV',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
    ];

    days.forEach(({ date, lunch, dinner }) => {
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        
        if (lunch) {
            icsContent.push(
                'BEGIN:VEVENT',
                `UID:${`lunch-${dateStr}@foodhero.app`}`,
                `DTSTAMP:${now}`,
                `DTSTART;VALUE=DATE:${dateStr}`,
                `DTEND;VALUE=DATE:${dateStr}`, // iCal DATE is exclusive for DTEND, but for all-day we usually just set start
                `SUMMARY:Lunch: ${lunch}`,
                'END:VEVENT'
            );
        }
        
        if (dinner) {
            icsContent.push(
                'BEGIN:VEVENT',
                `UID:${`dinner-${dateStr}@foodhero.app`}`,
                `DTSTAMP:${now}`,
                `DTSTART;VALUE=DATE:${dateStr}`,
                `DTEND;VALUE=DATE:${dateStr}`,
                `SUMMARY:Dinner: ${dinner}`,
                'END:VEVENT'
            );
        }
    });

    // Correcting DTEND for all-day events: it should be the day after DTSTART
    // Let's refine the loop to handle dates correctly.
    return generateCorrectICS(days, now);
};

function generateCorrectICS(days: { date: Date; lunch: string; dinner: string }[], now: string) {
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//FoodHero//MealPlan//SV',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
    ];

    days.forEach(({ date, lunch, dinner }) => {
        const start = new Date(date);
        start.setHours(0,0,0,0);
        const startStr = start.toISOString().split('T')[0].replace(/-/g, '');
        
        const end = new Date(start);
        end.setDate(start.getDate() + 1);
        const endStr = end.toISOString().split('T')[0].replace(/-/g, '');

        if (lunch) {
            icsContent.push(
                'BEGIN:VEVENT',
                `UID:${`lunch-${startStr}@foodhero.app`}`,
                `DTSTAMP:${now}`,
                `DTSTART;VALUE=DATE:${startStr}`,
                `DTEND;VALUE=DATE:${endStr}`,
                `SUMMARY:Lunch: ${lunch}`,
                'END:VEVENT'
            );
        }
        
        if (dinner) {
            icsContent.push(
                'BEGIN:VEVENT',
                `UID:${`dinner-${startStr}@foodhero.app`}`,
                `DTSTAMP:${now}`,
                `DTSTART;VALUE=DATE:${startStr}`,
                `DTEND;VALUE=DATE:${endStr}`,
                `SUMMARY:Dinner: ${dinner}`,
                'END:VEVENT'
            );
        }
    });

    icsContent.push('END:VCALENDAR');
    return icsContent.join('\r\n');
}