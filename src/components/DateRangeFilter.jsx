import React, { useState, useEffect, useCallback } from 'react';
import {
  Popover,
  Button,
  Box,
  InlineStack,
  BlockStack,
  Text,
  Divider,
  Icon,
  TextField
} from '@shopify/polaris';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon
} from '@shopify/polaris-icons';
import {
  format,
  parseISO,
  isValid,
  subDays,
  subMonths,
  addMonths,
  subYears,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay
} from 'date-fns';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export default function DateRangeFilter({
  value,
  onChange,
  range = 3,
  preYear = 1
}) {
  const activeRange = Number(range);
  const activePreYear = Number(preYear);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const minDateStr = format(subYears(today, activePreYear), 'yyyy-MM-dd');
  const currentYear = today.getFullYear();
  const minYear = currentYear - activePreYear;

  // Popover state
  const [popoverActive, setPopoverActive] = useState(false);

  // Selection state
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [hoverDate, setHoverDate] = useState(null);

  // Calendar navigation
  const [calMonth, setCalMonth] = useState(() => startOfMonth(today));
  const [calView, setCalView] = useState('days'); // 'days' | 'months'
  const [viewYear, setViewYear] = useState(currentYear);

  // Quick presets
  const PRESETS = [
    { label: 'Today', start: todayStr, end: todayStr },
    { label: 'Last Week', start: format(subDays(today, 6), 'yyyy-MM-dd'), end: todayStr },
    { label: 'Last 15 Days', start: format(subDays(today, 14), 'yyyy-MM-dd'), end: todayStr },
    { label: 'Last 30 Days', start: format(subDays(today, 29), 'yyyy-MM-dd'), end: todayStr }
  ];

  // Sync state when popover opens
  const syncFromValue = useCallback((val) => {
    if (typeof val !== 'string') return;
    try {
      const parsed = JSON.parse(val);
      if (parsed.start) {
        setFromDate(parsed.start);
        setCalMonth(startOfMonth(parseISO(parsed.start)));
      }
      if (parsed.end) setToDate(parsed.end);
    } catch (e) {
      // Invalid JSON, ignore
    }
  }, []);

  const handleTogglePopover = useCallback(() => {
    if (!popoverActive) {
      setCalView('days');
      setHoverDate(null);
      syncFromValue(value);
    }
    setPopoverActive((active) => !active);
  }, [popoverActive, syncFromValue, value]);

  const handleClose = useCallback(() => {
    setPopoverActive(false);
    setHoverDate(null);
    setCalView('days');
  }, []);

  // Apply handler
  const handleApply = useCallback(() => {
    if (fromDate && toDate) {
      onChange(JSON.stringify({ start: fromDate, end: toDate }));
      handleClose();
    }
  }, [fromDate, toDate, onChange, handleClose]);

  // Preset click
  const handlePresetClick = useCallback((preset) => {
    onChange(JSON.stringify({ start: preset.start, end: preset.end, label: preset.label }));
    handleClose();
  }, [onChange, handleClose]);

  // Day click logic
  const handleDayClick = useCallback((dateStr) => {
    if (!fromDate || (fromDate && toDate)) {
      setFromDate(dateStr);
      setToDate('');
    } else if (dateStr > fromDate) {
      setToDate(dateStr);
    } else if (dateStr === fromDate) {
      setFromDate('');
    } else {
      setFromDate(dateStr);
      setToDate('');
    }
  }, [fromDate, toDate]);

  // Month view
  const openMonthView = useCallback(() => {
    setViewYear(calMonth.getFullYear());
    setCalView('months');
  }, [calMonth]);

  const handleMonthSelect = useCallback((idx) => {
    setCalMonth(new Date(viewYear, idx, 1));
    setCalView('days');
  }, [viewYear]);

  // Clear selection
  const handleClear = useCallback(() => {
    setFromDate('');
    setToDate('');
  }, []);

  // Get label for button
  const getLabel = useCallback(() => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (parsed.label) return parsed.label;
        if (parsed.start && parsed.end) {
          const s = parseISO(parsed.start);
          const e = parseISO(parsed.end);
          if (isValid(s) && isValid(e)) {
            return `${format(s, 'MMM dd')} – ${format(e, 'MMM dd')}`;
          }
        }
      } catch (e) {
        // Invalid JSON
      }
    }
    return 'Select Date Range';
  }, [value]);

  const getSubLabel = useCallback(() => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (parsed.start && parsed.end) {
          const s = parseISO(parsed.start);
          const e = parseISO(parsed.end);
          if (isValid(s) && isValid(e)) {
            return parsed.start === parsed.end
              ? format(s, 'MMM dd, yyyy')
              : `${format(s, 'MMM dd')} – ${format(e, 'MMM dd, yyyy')}`;
          }
        }
      } catch (e) {
        // Invalid JSON
      }
    }
    return null;
  }, [value]);

  // Validation
  let isRangeValid = false;
  let errorMessage = '';
  if (fromDate && toDate) {
    const fObj = parseISO(fromDate);
    const tObj = parseISO(toDate);
    if (isValid(fObj) && isValid(tObj)) {
      const todayParsed = parseISO(todayStr);
      if (fObj > tObj) {
        errorMessage = 'From date cannot be later than To date';
      } else if (tObj > addMonths(fObj, activeRange)) {
        errorMessage = `Interval must not exceed ${activeRange} month${activeRange > 1 ? 's' : ''}`;
      } else if (tObj > todayParsed) {
        errorMessage = 'To date cannot be in the future';
      } else if (fObj < subYears(todayParsed, activePreYear)) {
        errorMessage = `From date cannot be older than ${activePreYear} year${activePreYear > 1 ? 's' : ''}`;
      } else {
        isRangeValid = true;
      }
    }
  }

  // Calendar max date
  const calMax = (() => {
    if (fromDate && !toDate) {
      const m = format(addMonths(parseISO(fromDate), activeRange), 'yyyy-MM-dd');
      return m < todayStr ? m : todayStr;
    }
    return todayStr;
  })();

  const effectiveHover = fromDate && !toDate && hoverDate && hoverDate > fromDate ? hoverDate : null;

  // Calendar cells
  const firstDay = startOfMonth(calMonth);
  const cells = [
    ...Array((getDay(firstDay) + 6) % 7).fill(null),
    ...eachDayOfInterval({ start: firstDay, end: endOfMonth(calMonth) })
  ];

  const subLabel = getSubLabel();

  const activator = (
    <Button
      onClick={handleTogglePopover}
      disclosure
      icon={CalendarIcon}
    >
      {getLabel()}
    </Button>
  );

  return (
    <Popover
      active={popoverActive}
      activator={activator}
      onClose={handleClose}
      preferredAlignment="right"
      sectioned={false}
    >
      <Box padding="400">
        <BlockStack gap="300">
          {/* Quick Select Presets */}
          <Box>
            <BlockStack gap="200">
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingXs" as="h3" tone="subdued">
                  QUICK SELECT
                </Text>
                {subLabel && (
                  <Text variant="bodySm" as="p" tone="subdued">
                    {subLabel}
                  </Text>
                )}
              </InlineStack>
              <InlineStack gap="200" wrap>
                {PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    size="slim"
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </InlineStack>
            </BlockStack>
          </Box>

          <Divider />

          {/* Selected Range Display */}
          <Box>
            <InlineStack gap="200" align="space-between">
              <Box
                padding="300"
                borderRadius="200"
                background={fromDate ? 'bg-surface-selected' : 'bg-surface-secondary'}
                style={{
                  flex: 1,
                  border: fromDate ? '2px solid var(--p-color-border-emphasis)' : '1px solid var(--p-color-border)'
                }}
              >
                <BlockStack gap="100">
                  <Text variant="headingXs" as="h4" tone="subdued">
                    FROM
                  </Text>
                  <Text variant="bodyMd" as="p" fontWeight={fromDate ? 'semibold' : 'regular'}>
                    {fromDate ? format(parseISO(fromDate), 'MMM dd, yyyy') : '—'}
                  </Text>
                </BlockStack>
              </Box>

              <Box style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                <Text variant="bodyLg" as="span" tone="subdued">
                  →
                </Text>
              </Box>

              <Box
                padding="300"
                borderRadius="200"
                background={toDate ? 'bg-surface-selected' : 'bg-surface-secondary'}
                style={{
                  flex: 1,
                  border: toDate ? '2px solid var(--p-color-border-emphasis)' : '1px solid var(--p-color-border)'
                }}
              >
                <BlockStack gap="100">
                  <Text variant="headingXs" as="h4" tone="subdued">
                    TO
                  </Text>
                  <Text variant="bodyMd" as="p" fontWeight={toDate ? 'semibold' : 'regular'}>
                    {toDate ? format(parseISO(toDate), 'MMM dd, yyyy') : fromDate ? 'Pick end date…' : '—'}
                  </Text>
                </BlockStack>
              </Box>

              {(fromDate || toDate) && (
                <Button
                  icon={XIcon}
                  variant="plain"
                  onClick={handleClear}
                  accessibilityLabel="Clear dates"
                />
              )}
            </InlineStack>
          </Box>

          <Divider />

          {/* Calendar */}
          <Box>
            <BlockStack gap="300">
              {/* Calendar Header */}
              <InlineStack align="space-between" blockAlign="center">
                <Button
                  icon={ChevronLeftIcon}
                  variant="plain"
                  onClick={() =>
                    calView === 'days'
                      ? setCalMonth((p) => subMonths(p, 1))
                      : setViewYear((y) => Math.max(y - 1, minYear))
                  }
                  disabled={
                    calView === 'days'
                      ? format(calMonth, 'yyyy-MM') <= format(subYears(today, activePreYear), 'yyyy-MM')
                      : viewYear <= minYear
                  }
                  accessibilityLabel="Previous"
                />

                {calView === 'days' ? (
                  <Button variant="plain" onClick={openMonthView}>
                    <Text variant="bodyMd" as="span" fontWeight="semibold">
                      {format(calMonth, 'MMMM yyyy')}
                    </Text>
                  </Button>
                ) : (
                  <Text variant="bodyMd" as="p" fontWeight="semibold">
                    {viewYear}
                  </Text>
                )}

                <Button
                  icon={ChevronRightIcon}
                  variant="plain"
                  onClick={() =>
                    calView === 'days'
                      ? setCalMonth((p) => addMonths(p, 1))
                      : setViewYear((y) => Math.min(y + 1, currentYear))
                  }
                  disabled={
                    calView === 'days'
                      ? format(calMonth, 'yyyy-MM') >= format(today, 'yyyy-MM')
                      : viewYear >= currentYear
                  }
                  accessibilityLabel="Next"
                />
              </InlineStack>

              {/* Month Grid */}
              {calView === 'months' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px'
                  }}
                >
                  {MONTHS_SHORT.map((mon, idx) => {
                    const ms = `${viewYear}-${String(idx + 1).padStart(2, '0')}`;
                    const isActive = ms === format(calMonth, 'yyyy-MM');
                    const isFuture = ms > format(today, 'yyyy-MM');
                    const isTooOld = ms < format(subYears(today, activePreYear), 'yyyy-MM');
                    
                    return (
                      <Button
                        key={mon}
                        onClick={() => handleMonthSelect(idx)}
                        disabled={isFuture || isTooOld}
                        variant={isActive ? 'primary' : 'secondary'}
                        size="slim"
                      >
                        {mon}
                      </Button>
                    );
                  })}
                </div>
              )}

              {/* Day Grid */}
              {calView === 'days' && (
                <BlockStack gap="200">
                  {/* Day names */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      textAlign: 'center',
                      gap: '4px'
                    }}
                  >
                    {DAY_NAMES.map((d) => (
                      <Text key={d} variant="bodySm" as="p" tone="subdued" fontWeight="semibold">
                        {d}
                      </Text>
                    ))}
                  </div>

                  {/* Day cells */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: '4px'
                    }}
                  >
                    {cells.map((day, i) => {
                      if (!day) return <div key={`e-${i}`} style={{ height: '36px' }} />;

                      const dateStr = format(day, 'yyyy-MM-dd');
                      const isToday = dateStr === todayStr;
                      const isDisabled = dateStr < minDateStr || dateStr > calMax;
                      const isFrom = dateStr === fromDate;
                      const isTo = dateStr === toDate;
                      const isHoverEnd = dateStr === effectiveHover;
                      const sameDay = fromDate && toDate && fromDate === toDate;

                      const inRange = !sameDay && fromDate && toDate && dateStr > fromDate && dateStr < toDate;
                      const inHoverRange =
                        !sameDay && fromDate && !toDate && effectiveHover && dateStr > fromDate && dateStr < effectiveHover;

                      const isSelected = isFrom || isTo || isHoverEnd;
                      const hasRangeFill = inRange || inHoverRange;

                      return (
                        <div
                          key={dateStr}
                          style={{
                            position: 'relative',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: hasRangeFill ? 'var(--p-color-bg-surface-selected)' : 'transparent',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={() => !isDisabled && setHoverDate(dateStr)}
                          onMouseLeave={() => setHoverDate(null)}
                        >
                          <button
                            disabled={isDisabled}
                            onClick={() => !isDisabled && handleDayClick(dateStr)}
                            style={{
                              width: '32px',
                              height: '32px',
                              border: isToday && !isSelected ? '2px solid var(--p-color-border-emphasis)' : 'none',
                              borderRadius: '50%',
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: isSelected || isToday ? 600 : 400,
                              color: isSelected
                                ? 'white'
                                : isDisabled
                                ? 'var(--p-color-text-disabled)'
                                : isToday
                                ? 'var(--p-color-text-emphasis)'
                                : 'var(--p-color-text)',
                              background: isSelected ? 'var(--p-color-bg-fill-emphasis)' : 'transparent',
                              outline: 'none',
                              padding: 0,
                              transition: 'all 0.1s'
                            }}
                            onMouseOver={(e) => {
                              if (!isDisabled && !isSelected) {
                                e.currentTarget.style.background = 'var(--p-color-bg-surface-hover)';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = 'transparent';
                              }
                            }}
                          >
                            {format(day, 'd')}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {fromDate && !toDate && (
                    <Text variant="bodySm" as="p" tone="subdued" alignment="center">
                      Click a date to set the end of your range
                    </Text>
                  )}
                </BlockStack>
              )}
            </BlockStack>
          </Box>

          {/* Apply Button */}
          {calView === 'days' && (
            <>
              {errorMessage && (
                <Box>
                  <Text variant="bodySm" as="p" tone="critical" alignment="center">
                    {errorMessage}
                  </Text>
                </Box>
              )}
              <Button
                variant="primary"
                onClick={handleApply}
                disabled={!fromDate || !toDate || !isRangeValid}
                fullWidth
              >
                Apply Range
              </Button>
            </>
          )}
        </BlockStack>
      </Box>
    </Popover>
  );
}