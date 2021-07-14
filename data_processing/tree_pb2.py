# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: tree.proto

import sys
_b=sys.version_info[0]<3 and (lambda x:x) or (lambda x:x.encode('latin1'))
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from google.protobuf import reflection as _reflection
from google.protobuf import symbol_database as _symbol_database
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()




DESCRIPTOR = _descriptor.FileDescriptor(
  name='tree.proto',
  package='',
  syntax='proto3',
  serialized_options=None,
  serialized_pb=_b('\n\ntree.proto\" \n\x0cMutationList\x12\x10\n\x08mutation\x18\x01 \x03(\x05\"\xc4\x01\n\x0b\x41llNodeData\x12\r\n\x05names\x18\x01 \x03(\t\x12\t\n\x01x\x18\x02 \x03(\x02\x12\t\n\x01y\x18\x03 \x03(\x02\x12\x11\n\tcountries\x18\x04 \x03(\x05\x12\x10\n\x08lineages\x18\x05 \x03(\x05\x12 \n\tmutations\x18\x06 \x03(\x0b\x32\r.MutationList\x12\r\n\x05\x64\x61tes\x18\x07 \x03(\x05\x12\x0f\n\x07parents\x18\x08 \x03(\x05\x12\x10\n\x08genbanks\x18\t \x03(\t\x12\x17\n\x0f\x65pi_isl_numbers\x18\n \x03(\x05\"\x8c\x01\n\x07\x41llData\x12\x1f\n\tnode_data\x18\x01 \x01(\x0b\x32\x0c.AllNodeData\x12\x17\n\x0f\x63ountry_mapping\x18\x02 \x03(\t\x12\x17\n\x0flineage_mapping\x18\x03 \x03(\t\x12\x18\n\x10mutation_mapping\x18\x04 \x03(\t\x12\x14\n\x0c\x64\x61te_mapping\x18\x05 \x03(\tb\x06proto3')
)




_MUTATIONLIST = _descriptor.Descriptor(
  name='MutationList',
  full_name='MutationList',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    _descriptor.FieldDescriptor(
      name='mutation', full_name='MutationList.mutation', index=0,
      number=1, type=5, cpp_type=1, label=3,
      has_default_value=False, default_value=[],
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  serialized_options=None,
  is_extendable=False,
  syntax='proto3',
  extension_ranges=[],
  oneofs=[
  ],
  serialized_start=14,
  serialized_end=46,
)


_ALLNODEDATA = _descriptor.Descriptor(
  name='AllNodeData',
  full_name='AllNodeData',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    _descriptor.FieldDescriptor(
      name='names', full_name='AllNodeData.names', index=0,
      number=1, type=9, cpp_type=9, label=3,
      has_default_value=False, default_value=[],
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='x', full_name='AllNodeData.x', index=1,
      number=2, type=2, cpp_type=6, label=3,
      has_default_value=False, default_value=[],
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='y', full_name='AllNodeData.y', index=2,
      number=3, type=2, cpp_type=6, label=3,
      has_default_value=False, default_value=[],
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='countries', full_name='AllNodeData.countries', index=3,
      number=4, type=5, cpp_type=1, label=3,
      has_default_value=False, default_value=[],
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='lineages', full_name='AllNodeData.lineages', index=4,
      number=5, type=5, cpp_type=1, label=3,
      has_default_value=False, default_value=[],
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='mutations', full_name='AllNodeData.mutations', index=5,
      number=6, type=11, cpp_type=10, label=3,
      has_default_value=False, default_value=[],
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='dates', full_name='AllNodeData.dates', index=6,
      number=7, type=5, cpp_type=1, label=3,
      has_default_value=False, default_value=[],
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='parents', full_name='AllNodeData.parents', index=7,
      number=8, type=5, cpp_type=1, label=3,
      has_default_value=False, default_value=[],
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='genbanks', full_name='AllNodeData.genbanks', index=8,
      number=9, type=9, cpp_type=9, label=3,
      has_default_value=False, default_value=[],
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='epi_isl_numbers', full_name='AllNodeData.epi_isl_numbers', index=9,
      number=10, type=5, cpp_type=1, label=3,
      has_default_value=False, default_value=[],
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  serialized_options=None,
  is_extendable=False,
  syntax='proto3',
  extension_ranges=[],
  oneofs=[
  ],
  serialized_start=49,
  serialized_end=245,
)


_ALLDATA = _descriptor.Descriptor(
  name='AllData',
  full_name='AllData',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    _descriptor.FieldDescriptor(
      name='node_data', full_name='AllData.node_data', index=0,
      number=1, type=11, cpp_type=10, label=1,
      has_default_value=False, default_value=None,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='country_mapping', full_name='AllData.country_mapping', index=1,
      number=2, type=9, cpp_type=9, label=3,
      has_default_value=False, default_value=[],
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='lineage_mapping', full_name='AllData.lineage_mapping', index=2,
      number=3, type=9, cpp_type=9, label=3,
      has_default_value=False, default_value=[],
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='mutation_mapping', full_name='AllData.mutation_mapping', index=3,
      number=4, type=9, cpp_type=9, label=3,
      has_default_value=False, default_value=[],
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='date_mapping', full_name='AllData.date_mapping', index=4,
      number=5, type=9, cpp_type=9, label=3,
      has_default_value=False, default_value=[],
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  serialized_options=None,
  is_extendable=False,
  syntax='proto3',
  extension_ranges=[],
  oneofs=[
  ],
  serialized_start=248,
  serialized_end=388,
)

_ALLNODEDATA.fields_by_name['mutations'].message_type = _MUTATIONLIST
_ALLDATA.fields_by_name['node_data'].message_type = _ALLNODEDATA
DESCRIPTOR.message_types_by_name['MutationList'] = _MUTATIONLIST
DESCRIPTOR.message_types_by_name['AllNodeData'] = _ALLNODEDATA
DESCRIPTOR.message_types_by_name['AllData'] = _ALLDATA
_sym_db.RegisterFileDescriptor(DESCRIPTOR)

MutationList = _reflection.GeneratedProtocolMessageType('MutationList', (_message.Message,), dict(
  DESCRIPTOR = _MUTATIONLIST,
  __module__ = 'tree_pb2'
  # @@protoc_insertion_point(class_scope:MutationList)
  ))
_sym_db.RegisterMessage(MutationList)

AllNodeData = _reflection.GeneratedProtocolMessageType('AllNodeData', (_message.Message,), dict(
  DESCRIPTOR = _ALLNODEDATA,
  __module__ = 'tree_pb2'
  # @@protoc_insertion_point(class_scope:AllNodeData)
  ))
_sym_db.RegisterMessage(AllNodeData)

AllData = _reflection.GeneratedProtocolMessageType('AllData', (_message.Message,), dict(
  DESCRIPTOR = _ALLDATA,
  __module__ = 'tree_pb2'
  # @@protoc_insertion_point(class_scope:AllData)
  ))
_sym_db.RegisterMessage(AllData)


# @@protoc_insertion_point(module_scope)