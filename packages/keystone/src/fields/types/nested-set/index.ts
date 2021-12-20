import {
  BaseListTypeInfo,
  FieldTypeFunc,
  CommonFieldConfig,
  fieldType,
  AdminMetaRootVal,
  KeystoneContext,
} from '../../../types';
import { resolveView } from '../../resolve-view';
import { graphql } from '../../..';


type SelectDisplayConfig = {
  ui?: {
    // Sets the relationship to display as a Select field
    displayMode?: 'select';
    /**
     * The path of the field to use from the related list for item labels in the select.
     * Defaults to the labelField configured on the related list.
     */
    labelField?: string;
  };
};

export type NestedSetConfig<ListTypeInfo extends BaseListTypeInfo> =
  CommonFieldConfig<ListTypeInfo> & {} & SelectDisplayConfig;

export const nestedSet =
  <ListTypeInfo extends BaseListTypeInfo>({
    ...config
  }: NestedSetConfig<ListTypeInfo> = {}): FieldTypeFunc<ListTypeInfo> =>
  meta => {
    const listTypes = meta.lists[meta.listKey].types;
    const commonConfig = {
      ...config,
      views: resolveView('nested-set/views'),
      getAdminMeta: (
        adminMetaRoot: AdminMetaRootVal
      ): Parameters<typeof import('./views').controller>[0]['fieldMeta'] => {
        if (!listTypes) {
          throw new Error(
            `The ref [${listTypes}] on relationship [${meta.listKey}.${meta.fieldKey}] is invalid`
          );
        }
        return {
          listKey: meta.listKey,
          labelField: adminMetaRoot.listsByKey[meta.listKey].labelField,
        };
      },
    };
    return fieldType({
      kind: 'multi',
      fields: {
        parent: {
          kind: 'scalar',
          scalar: 'String',
          mode: 'optional',
        },
        left: {
          kind: 'scalar',
          scalar: 'String',
          mode: 'optional',
        },
        rigth: {
          kind: 'scalar',
          scalar: 'String',
          mode: 'optional',
        },
        depth: {
          kind: 'scalar',
          scalar: 'Int',
          mode: 'optional',
        },
      },
    })({
      ...commonConfig,
      input: {
        create: {
          arg: graphql.arg({ type: listTypes.where }),
          resolve(val) {
            if (val === undefined) {
              return null;
            }
            // return val;
          },
        },
        update: {
          arg: graphql.arg({ type: listTypes.where }),
        },
      },
      output: graphql.field({
        type: listTypes.output,
        resolve( value) {
          console.log('value', value);
          return value;
        },
      }),
    });
  };
