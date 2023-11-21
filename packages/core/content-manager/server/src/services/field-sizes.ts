import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

const needsFullSize = {
  default: 12,
  isResizable: false,
};

const smallSize = {
  default: 4,
  isResizable: true,
};

const defaultSize = {
  default: 6,
  isResizable: true,
};

const fieldSizes: any = {
  // Full row and not resizable
  dynamiczone: needsFullSize,
  component: needsFullSize,
  json: needsFullSize,
  richtext: needsFullSize,
  blocks: needsFullSize,
  // Small and resizable
  checkbox: smallSize,
  boolean: smallSize,
  date: smallSize,
  time: smallSize,
  biginteger: smallSize,
  decimal: smallSize,
  float: smallSize,
  integer: smallSize,
  number: smallSize,
  // Medium and resizable
  datetime: defaultSize,
  email: defaultSize,
  enumeration: defaultSize,
  media: defaultSize,
  password: defaultSize,
  relation: defaultSize,
  string: defaultSize,
  text: defaultSize,
  timestamp: defaultSize,
  uid: defaultSize,
};

const createFieldSizesService = ({ strapi }: any) => {
  const fieldSizesService = {
    getAllFieldSizes() {
      return fieldSizes;
    },

    hasFieldSize(type: any) {
      return !!fieldSizes[type];
    },

    getFieldSize(type?: any) {
      if (!type) {
        throw new ApplicationError('The type is required');
      }

      const fieldSize = fieldSizes[type];
      if (!fieldSize) {
        throw new ApplicationError(`Could not find field size for type ${type}`);
      }

      return fieldSize;
    },

    setFieldSize(type: any, size: any) {
      if (!type) {
        throw new ApplicationError('The type is required');
      }

      if (!size) {
        throw new ApplicationError('The size is required');
      }

      fieldSizes[type] = size;
    },

    setCustomFieldInputSizes() {
      // Find all custom fields already registered
      const customFields = strapi.container.get('custom-fields').getAll();

      // If they have a custom field size, register it
      Object.entries(customFields).forEach(([uid, customField]: any) => {
        if (customField.inputSize) {
          fieldSizesService.setFieldSize(uid, customField.inputSize);
        }
      });
    },
  };

  return fieldSizesService;
};

export default createFieldSizesService;