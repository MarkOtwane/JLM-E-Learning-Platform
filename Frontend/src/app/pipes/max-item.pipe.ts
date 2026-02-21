import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe that returns the item with the maximum value for a given property.
 * Usage: array | maxItem: 'propertyName'
 * Example: [{count: 5, month: 'Jan'}, {count: 10, month: 'Feb'}] | maxItem: 'count' returns {count: 10, month: 'Feb'}
 */
@Pipe({
  name: 'maxItem',
  standalone: true,
})
export class MaxItemPipe implements PipeTransform {
  transform<T>(value: T[], property: keyof T): T | null {
    if (!value || !Array.isArray(value) || value.length === 0) {
      return null;
    }

    return value.reduce((maxItem: T | null, item: T) => {
      const propValue = Number(item[property]);
      const maxValue = maxItem ? Number(maxItem[property]) : -Infinity;
      return !isNaN(propValue) && propValue > maxValue ? item : maxItem;
    }, null);
  }
}
