import dsdSlaSchema from './dsd_sla_schema.js';
import realtime_schema from './realtime_schema.js';
export default `
type PermitComment {
  comment_seq_number: Int
  comment_date: String
  comments: String
}

type PermitCustomField {
  type: String
  name: String
  value: String
}

type Permit {
  permit_number: String
  permit_group: String
  permit_type: String
  permit_subtype: String
  permit_category: String
  permit_description: String
  applicant_name: String
  application_name: String
  applied_date: String
  status_current: String
  status_date: String
  technical_contact_name: String
  technical_contact_email: String
  created_by: String
  building_value: String
  job_value: String
  total_project_valuation: String
  total_sq_feet: String
  fees: Float
  paid: Float
  balance: Float
  invoiced_fee_total: Float
  civic_address_id: String
  address: String
  x: Float
  y: Float
  contractor_names: [String]
  contractor_license_numbers: [String]
  internal_record_id: String
  comments: [PermitComment]
  custom_fields: [PermitCustomField]
}

type PermitTask {
  permit_number: String
  permit_group: String
  permit_type: String
  permit_subtype: String
  permit_category: String
  process_code: String
  task: String
  task_status: String
  current_status_date: String
  step_number: String
  relation_sequence_id: String
  parent_task_name: String
  user_name: String
  user_id: String
  user_department: String
  due_date: String	
  record_date: String	
  comments: String
  is_completed: Boolean
  is_active: Boolean
  assigned_date: String
  assigned_user: String
  assigned_department: String
  process_history_sequence_number: Int
}

type Inspection {
  inspection_id: Int
  permit_number: String
  permit_group: String
  permit_type: String
  permit_subtype: String
  permit_category: String
  inspection_type: String
  requestor_name: String
  status: String
  inspector: String
  request_date: String
  scheduled_date: String
  completed_date: String
  submit_date: String
  result_comment: String
  unit_number: String
  record_date: String
}

${dsdSlaSchema}
${realtime_schema}
`;
