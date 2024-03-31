import * as crypto from 'crypto';

export interface InputData {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  properties: {
    id: string;
    roomId: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    values: {
      id: string;
      propertyId: string;
      value: unknown;
      createdAt: string;
      updatedAt: string;
    }[];
  }[];
}

export interface OutputData {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  properties: {
    time: string;
    [propertyName: string]: string;
  }[];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-indexed
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${day}-${month}-${year}, ${hours}:${minutes}`;
}

type property = { time: string; [propertyName: string]: string };

export function transformData(inputData: InputData): OutputData {
  const data = inputData;

  const transformedProperties = data.properties.map((property) => {
    const values: property[] = [];

    property.values.forEach((value) => {
      values.push({
        time: formatDate(value.createdAt),
        [property.name]: String(value.value),
      });
    });

    return values;
  });

  return {
    id: data.id,
    name: data.name,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    properties: transformedProperties.flat(),
  };
}

export function generateApiKey(email) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .createHash('sha256')
    .update(email + salt)
    .digest('hex');

  return `dev:${hash}`;
}

export function checkMqttTopic(pattern, topic) {
  // Split the pattern and topic into levels.
  const patternLevels = pattern.split('/');
  const topicLevels = topic.split('/');

  // Check if the pattern and topic have the same number of levels.
  if (patternLevels.length !== topicLevels.length) {
    return false;
  }

  // Iterate over the levels and check if they match.
  for (let i = 0; i < patternLevels.length; i++) {
    const patternLevel = patternLevels[i];
    const topicLevel = topicLevels[i];

    // If the pattern level is a wildcard, then it matches any topic level.
    if (patternLevel === '+') {
      continue;
    }

    // If the pattern level is a multi-level wildcard, then it matches any number of topic levels.
    if (patternLevel === '#') {
      return true;
    }

    // If the pattern level does not match the topic level, then the pattern does not match the topic.
    if (patternLevel !== topicLevel) {
      return false;
    }
  }

  // If all of the levels match, then the pattern matches the topic.
  return true;
}
