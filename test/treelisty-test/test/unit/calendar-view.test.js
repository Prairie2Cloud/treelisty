/**
 * Calendar View Tests (Build 494)
 * Tests for the calendar view feature including date extraction,
 * event generation, and pattern-specific behavior.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Load the treeplexity.html source
const htmlPath = path.resolve(__dirname, '../../../../treeplexity.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

// Extract the getNodeDates function
function extractFunction(name) {
    const regex = new RegExp(`function ${name}\\s*\\([^)]*\\)\\s*\\{`, 'g');
    const match = regex.exec(htmlContent);
    if (!match) return null;

    let braceCount = 1;
    let i = match.index + match[0].length;
    while (braceCount > 0 && i < htmlContent.length) {
        if (htmlContent[i] === '{') braceCount++;
        if (htmlContent[i] === '}') braceCount--;
        i++;
    }
    return htmlContent.slice(match.index, i);
}

describe('Calendar View', () => {
    describe('Feature Presence', () => {
        it('should have FullCalendar CDN script', () => {
            expect(htmlContent).toContain('fullcalendar@6.1.10/index.global.min.js');
        });

        it('should have calendar view container', () => {
            expect(htmlContent).toContain('id="view-calendar"');
        });

        it('should have calendar wrapper element', () => {
            expect(htmlContent).toContain('id="calendar-wrapper"');
        });

        it('should have calendar empty state', () => {
            expect(htmlContent).toContain('id="calendar-empty-state"');
        });

        it('should have calendar button in view dropdown', () => {
            expect(htmlContent).toContain('id="view-calendar-btn"');
        });

        it('should have calendar checkmark element', () => {
            expect(htmlContent).toContain('id="calendar-check"');
        });

        it('should have calendar back button', () => {
            expect(htmlContent).toContain('id="calendar-back-btn"');
        });
    });

    describe('Calendar CSS', () => {
        it('should have calendar view styles', () => {
            expect(htmlContent).toContain('#view-calendar {');
        });

        it('should have FullCalendar dark theme overrides', () => {
            expect(htmlContent).toContain('.fc-theme-standard');
        });

        it('should have calendar event styles', () => {
            expect(htmlContent).toContain('.fc-event {');
        });

        it('should have mobile calendar adjustments', () => {
            expect(htmlContent).toMatch(/@media.*max-width.*768px[\s\S]*?#view-calendar/);
        });

        it('should style today highlight with theme color', () => {
            expect(htmlContent).toContain('.fc-day-today');
        });
    });

    describe('Calendar Functions', () => {
        it('should have getNodeDates function', () => {
            expect(htmlContent).toContain('function getNodeDates(node)');
        });

        it('should have getCalendarEvents function', () => {
            expect(htmlContent).toContain('function getCalendarEvents()');
        });

        it('should have renderCalendar function', () => {
            expect(htmlContent).toContain('function renderCalendar()');
        });

        it('should have toggleCalendarView function', () => {
            expect(htmlContent).toContain('function toggleCalendarView()');
        });

        it('should expose toggleCalendarView globally', () => {
            expect(htmlContent).toContain('window.toggleCalendarView = toggleCalendarView');
        });

        it('should expose renderCalendar globally', () => {
            expect(htmlContent).toContain('window.renderCalendar = renderCalendar');
        });
    });

    describe('getNodeDates Logic', () => {
        const functionCode = extractFunction('getNodeDates');

        it('should extract pmStartDate', () => {
            expect(functionCode).toContain('pmStartDate');
        });

        it('should extract pmDueDate', () => {
            expect(functionCode).toContain('pmDueDate');
        });

        it('should handle lifetree pattern dates', () => {
            expect(functionCode).toContain('lifetree');
            expect(functionCode).toContain('eventDate');
            expect(functionCode).toContain('birthDate');
            expect(functionCode).toContain('deathDate');
        });

        it('should handle familytree pattern dates', () => {
            expect(functionCode).toContain('familytree');
            expect(functionCode).toContain('marriageDate');
        });

        it('should handle sales pattern dates', () => {
            expect(functionCode).toContain('sales');
            expect(functionCode).toContain('expectedCloseDate');
        });

        it('should handle event pattern dates', () => {
            expect(functionCode).toContain("pattern === 'event'");
            expect(functionCode).toContain('bookingDeadline');
        });

        it('should validate dates before adding', () => {
            expect(functionCode).toContain('isNaN(Date.parse');
        });

        it('should assign distinct colors to date types', () => {
            expect(functionCode).toContain('#3B82F6'); // Blue for Start
            expect(functionCode).toContain('#EF4444'); // Red for Due
            expect(functionCode).toContain('#10B981'); // Green for Event/Close
            expect(functionCode).toContain('#EC4899'); // Pink for Birth
        });
    });

    describe('getCalendarEvents Logic', () => {
        const functionCode = extractFunction('getCalendarEvents');

        it('should traverse children', () => {
            expect(functionCode).toContain('node.children');
        });

        it('should traverse items', () => {
            expect(functionCode).toContain('node.items');
        });

        it('should traverse subtasks', () => {
            expect(functionCode).toContain('node.subtasks');
        });

        it('should traverse subItems', () => {
            expect(functionCode).toContain('node.subItems');
        });

        it('should create events with nodeId in extendedProps', () => {
            expect(functionCode).toContain('extendedProps');
            expect(functionCode).toContain('nodeId');
        });

        it('should include event type in title', () => {
            expect(functionCode).toContain('title:');
            expect(functionCode).toContain('d.type');
        });
    });

    describe('renderCalendar Logic', () => {
        const functionCode = extractFunction('renderCalendar');

        it('should handle empty events with empty state', () => {
            expect(functionCode).toContain('events.length === 0');
            expect(functionCode).toContain('emptyState.style.display');
        });

        it('should initialize FullCalendar', () => {
            expect(functionCode).toContain('new FullCalendar.Calendar');
        });

        it('should use dayGridMonth as initial view', () => {
            expect(functionCode).toContain("initialView: 'dayGridMonth'");
        });

        it('should have month and week view options', () => {
            expect(functionCode).toContain('dayGridMonth');
            expect(functionCode).toContain('timeGridWeek');
        });

        it('should handle eventClick', () => {
            expect(functionCode).toContain('eventClick:');
        });

        it('should call showInfo on event click', () => {
            expect(functionCode).toContain('showInfo');
        });

        it('should refresh events when calendar exists', () => {
            expect(functionCode).toContain('removeAllEvents');
            expect(functionCode).toContain('addEventSource');
        });
    });

    describe('toggleCalendarView Logic', () => {
        const functionCode = extractFunction('toggleCalendarView');

        it('should check if calendar is active', () => {
            expect(functionCode).toContain('classList.contains');
        });

        it('should hide tree view when opening calendar', () => {
            expect(functionCode).toContain("treeView.classList.add('hidden')");
        });

        it('should close canvas view when opening calendar', () => {
            expect(functionCode).toContain("canvasView?.classList.remove('active')");
        });

        it('should close 3D view when opening calendar', () => {
            expect(functionCode).toContain("view3D?.classList.remove('active')");
        });

        it('should close Gantt view when opening calendar', () => {
            expect(functionCode).toContain("viewGantt?.classList.remove('active')");
        });

        it('should set viewMode to calendar', () => {
            expect(functionCode).toContain("viewMode = 'calendar'");
        });

        it('should call renderCalendar when opening', () => {
            expect(functionCode).toContain('renderCalendar()');
        });

        it('should update view dropdown', () => {
            expect(functionCode).toContain('updateViewDropdown');
        });

        it('should restore tree view when closing', () => {
            expect(functionCode).toContain("treeView.classList.remove('hidden')");
        });
    });

    describe('View Integration', () => {
        it('should include calendar in viewIcons map', () => {
            expect(htmlContent).toContain("calendar: '📅'");
        });

        it('should include calendar in viewLabels map', () => {
            expect(htmlContent).toContain("calendar: 'Calendar'");
        });

        it('should have closeCalendarViewIfActive helper', () => {
            expect(htmlContent).toContain('function closeCalendarViewIfActive()');
        });

        it('should close calendar from tree view handler', () => {
            // Check that tree view button handler closes calendar
            const treeHandler = htmlContent.match(/view-tree-btn[\s\S]*?addEventListener[\s\S]*?closeCalendarViewIfActive/);
            expect(treeHandler).toBeTruthy();
        });

        it('should close calendar from canvas view handler', () => {
            const canvasHandler = htmlContent.match(/view-canvas-btn[\s\S]*?addEventListener[\s\S]*?closeCalendarViewIfActive/);
            expect(canvasHandler).toBeTruthy();
        });

        it('should close calendar from 3D view handler', () => {
            const handler3D = htmlContent.match(/view-3d-btn[\s\S]*?addEventListener[\s\S]*?closeCalendarViewIfActive/);
            expect(handler3D).toBeTruthy();
        });

        it('should close calendar when opening Gantt view', () => {
            expect(htmlContent).toMatch(/toggleGanttView[\s\S]*?view-calendar[\s\S]*?classList\.remove\('active'\)/);
        });

        it('should close calendar when opening Canvas view', () => {
            expect(htmlContent).toMatch(/toggleViewMode[\s\S]*?view-calendar[\s\S]*?classList\.remove\('active'\)/);
        });

        it('should close calendar when opening 3D view', () => {
            expect(htmlContent).toMatch(/toggle3DView[\s\S]*?view-calendar[\s\S]*?classList\.remove\('active'\)/);
        });
    });

    describe('Calendar View Button Handler', () => {
        it('should have calendar button click handler', () => {
            expect(htmlContent).toContain("document.getElementById('view-calendar-btn')?.addEventListener('click'");
        });

        it('should check viewMode before toggling', () => {
            // Find the calendar button handler and verify it checks viewMode
            const calendarHandler = htmlContent.match(/view-calendar-btn[\s\S]*?addEventListener\('click'[\s\S]*?viewMode !== 'calendar'/);
            expect(calendarHandler).toBeTruthy();
        });

        it('should call toggleCalendarView', () => {
            expect(htmlContent).toMatch(/view-calendar-btn[\s\S]*?toggleCalendarView\(\)/);
        });
    });

    describe('Pattern-Specific Date Handling', () => {
        const functionCode = extractFunction('getNodeDates');

        it('should get pattern from window.capexTree', () => {
            expect(functionCode).toContain("tree?.pattern?.key || 'generic'");
        });

        it('should return empty array for nodes without dates', () => {
            expect(functionCode).toContain('const dates = []');
            expect(functionCode).toContain('return dates');
        });

        it('should include date type in returned object', () => {
            expect(functionCode).toContain("type: 'Start'");
            expect(functionCode).toContain("type: 'Due'");
            expect(functionCode).toContain("type: 'Event'");
            expect(functionCode).toContain("type: 'Birth'");
            expect(functionCode).toContain("type: 'Death'");
            expect(functionCode).toContain("type: 'Marriage'");
            expect(functionCode).toContain("type: 'Close'");
            expect(functionCode).toContain("type: 'Deadline'");
        });
    });

    describe('Calendar Back Button', () => {
        it('should have back button initialization', () => {
            expect(htmlContent).toContain("getElementById('calendar-back-btn')");
        });

        it('should call toggleCalendarView on back button click', () => {
            expect(htmlContent).toMatch(/calendar-back-btn[\s\S]*?addEventListener\('click'[\s\S]*?toggleCalendarView\(\)/);
        });
    });

    describe('Empty State Handling', () => {
        it('should show empty state when no events', () => {
            const functionCode = extractFunction('renderCalendar');
            expect(functionCode).toContain("emptyState.style.display = 'block'");
        });

        it('should hide calendar wrapper when no events', () => {
            const functionCode = extractFunction('renderCalendar');
            expect(functionCode).toContain("calendarEl.style.display = 'none'");
        });

        it('should have helpful empty state message', () => {
            expect(htmlContent).toContain('No dated items found in this tree');
        });

        it('should suggest adding dates in empty state', () => {
            expect(htmlContent).toContain('Add Start Dates, Due Dates, or Events');
        });
    });

    // =========================================================================
    // Todo Lens Functions (Phase 2 - Build 818+)
    // =========================================================================

    describe('Todo Lens Functions', () => {
        describe('flattenTree', () => {
            it('should have flattenTree function defined', () => {
                expect(htmlContent).toContain('function flattenTree(tree)');
            });

            it('should expose flattenTree to window', () => {
                expect(htmlContent).toContain('window.flattenTree = flattenTree');
            });

            it('should traverse all child array types', () => {
                const functionCode = extractFunction('flattenTree');
                expect(functionCode).toContain("'children'");
                expect(functionCode).toContain("'items'");
                expect(functionCode).toContain("'subItems'");
                expect(functionCode).toContain("'subtasks'");
                expect(functionCode).toContain("'phases'");
            });

            it('should handle null tree gracefully', () => {
                const functionCode = extractFunction('flattenTree');
                expect(functionCode).toContain('if (!tree) return nodes');
            });
        });

        describe('Date Helper Functions', () => {
            it('should have isToday function', () => {
                expect(htmlContent).toContain('function isToday(dateStr)');
                expect(htmlContent).toContain('window.isToday = isToday');
            });

            it('should have isTomorrow function', () => {
                expect(htmlContent).toContain('function isTomorrow(dateStr)');
                expect(htmlContent).toContain('window.isTomorrow = isTomorrow');
            });

            it('should have isThisWeek function', () => {
                expect(htmlContent).toContain('function isThisWeek(dateStr)');
                expect(htmlContent).toContain('window.isThisWeek = isThisWeek');
            });

            it('should have isFuture function', () => {
                expect(htmlContent).toContain('function isFuture(dateStr)');
                expect(htmlContent).toContain('window.isFuture = isFuture');
            });

            it('isToday should use parseLocalDate', () => {
                const functionCode = extractFunction('isToday');
                expect(functionCode).toContain('parseLocalDate(dateStr)');
                expect(functionCode).toContain('getTodayLocal()');
            });

            it('isTomorrow should calculate tomorrow correctly', () => {
                const functionCode = extractFunction('isTomorrow');
                expect(functionCode).toContain('tomorrow.setDate(tomorrow.getDate() + 1)');
            });

            it('isThisWeek should calculate Monday start of week', () => {
                const functionCode = extractFunction('isThisWeek');
                expect(functionCode).toContain('mondayOffset');
                expect(functionCode).toContain('startOfWeek');
                expect(functionCode).toContain('endOfWeek');
            });

            it('date helpers should handle null gracefully', () => {
                const isTodayCode = extractFunction('isToday');
                const isTomorrowCode = extractFunction('isTomorrow');
                const isThisWeekCode = extractFunction('isThisWeek');
                const isFutureCode = extractFunction('isFuture');

                expect(isTodayCode).toContain('if (!dateStr) return false');
                expect(isTomorrowCode).toContain('if (!dateStr) return false');
                expect(isThisWeekCode).toContain('if (!dateStr) return false');
                expect(isFutureCode).toContain('if (!dateStr) return false');
            });
        });

        describe('getTodoLensGroups', () => {
            it('should have getTodoLensGroups function', () => {
                expect(htmlContent).toContain('function getTodoLensGroups(tree)');
            });

            it('should expose getTodoLensGroups to window', () => {
                expect(htmlContent).toContain('window.getTodoLensGroups = getTodoLensGroups');
            });

            it('should return all six groups', () => {
                const functionCode = extractFunction('getTodoLensGroups');
                expect(functionCode).toContain('overdue:');
                expect(functionCode).toContain('today:');
                expect(functionCode).toContain('tomorrow:');
                expect(functionCode).toContain('thisWeek:');
                expect(functionCode).toContain('upcoming:');
                expect(functionCode).toContain('someday:');
            });

            it('should use getNodeSchedule for overdue detection', () => {
                const functionCode = extractFunction('getTodoLensGroups');
                expect(functionCode).toContain('getNodeSchedule(n)');
                expect(functionCode).toContain('schedule.isOverdue');
            });

            it('should filter schedulable nodes by pmDueDate or pmStartDate', () => {
                const functionCode = extractFunction('getTodoLensGroups');
                expect(functionCode).toContain('n.pmDueDate || n.pmStartDate');
            });

            it('should exclude completed tasks from active groups', () => {
                const functionCode = extractFunction('getTodoLensGroups');
                expect(functionCode).toContain('!schedule.isComplete');
            });

            it('should handle null tree with empty groups', () => {
                const functionCode = extractFunction('getTodoLensGroups');
                expect(functionCode).toContain('if (!targetTree)');
                expect(functionCode).toContain('overdue: []');
            });

            it('someday group should include undated incomplete tasks', () => {
                const functionCode = extractFunction('getTodoLensGroups');
                expect(functionCode).toContain('!n.pmDueDate && !isComplete');
            });
        });

        describe('getTodoLensSummary', () => {
            it('should have getTodoLensSummary function', () => {
                expect(htmlContent).toContain('function getTodoLensSummary(groups)');
            });

            it('should expose getTodoLensSummary to window', () => {
                expect(htmlContent).toContain('window.getTodoLensSummary = getTodoLensSummary');
            });

            it('should calculate totalScheduled correctly', () => {
                const functionCode = extractFunction('getTodoLensSummary');
                expect(functionCode).toContain('totalScheduled:');
                expect(functionCode).toContain('groups.overdue.length + groups.today.length');
            });

            it('should provide hasOverdue boolean', () => {
                const functionCode = extractFunction('getTodoLensSummary');
                expect(functionCode).toContain('hasOverdue: groups.overdue.length > 0');
            });

            it('should provide hasTodayTasks boolean', () => {
                const functionCode = extractFunction('getTodoLensSummary');
                expect(functionCode).toContain('hasTodayTasks: groups.today.length > 0');
            });
        });
    });
});
