import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe that returns the maximum value of a property from an array of objects.
 * Usage: array | max: 'propertyName'
 * Example: [{count: 5}, {count: 10}] | max: 'count' returns 10
 */
@Pipe({
  name: 'max',
  standalone: true,
})
export class MaxPipe implements PipeTransform {
  transform<T>(value: T[], property: keyof T): number {
    if (!value || !Array.isArray(value) || value.length === 0) {
      return 0;
    }

    const maxValue = value.reduce((max: number, item: T) => {
      const propValue = Number(item[property]);
      return !isNaN(propValue) && propValue > max ? propValue : max;
    }, 0);

    return maxValue;
  }
}
