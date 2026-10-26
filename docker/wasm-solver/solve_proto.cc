// Minimal C API surface for Google OR-Tools CP-SAT over WebAssembly.
// Exports SolveProto and FreeBuffer for binary protobuf communication.

#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <string>

#include <emscripten/emscripten.h>

#include "ortools/sat/cp_model.h"
#include "ortools/sat/cp_model.pb.h"
#include "ortools/sat/model.h"
#include "ortools/sat/sat_parameters.pb.h"

extern "C" {

/**
 * Solves a constraint programming model passed as serialized CpModelProto bytes.
 *
 * @param model_bytes Pointer to raw serialized CpModelProto binary buffer.
 * @param model_len Length of model_bytes in bytes.
 * @param params_bytes Pointer to raw serialized SatParameters binary buffer (optional).
 * @param params_len Length of params_bytes in bytes (optional).
 * @param out_len Output pointer receiving the length of the returned response buffer.
 * @return Pointer to heap-allocated serialized CpSolverResponse binary buffer,
 *         or nullptr on unrecoverable failure. Caller must release with FreeBuffer().
 */
EMSCRIPTEN_KEEPALIVE
uint8_t* SolveProto(const uint8_t* model_bytes, int model_len,
                    const uint8_t* params_bytes, int params_len,
                    int* out_len) {
  if (out_len == nullptr) {
    return nullptr;
  }
  *out_len = 0;

  operations_research::sat::CpModelProto model_proto;
  if (model_bytes != nullptr && model_len > 0) {
    if (!model_proto.ParseFromArray(model_bytes, model_len)) {
      operations_research::sat::CpSolverResponse error_response;
      error_response.set_status(operations_research::sat::CpSolverStatus::MODEL_INVALID);
      error_response.set_solution_info("Failed to parse CpModelProto buffer.");
      std::string error_str;
      error_response.SerializeToString(&error_str);
      *out_len = static_cast<int>(error_str.size());
      uint8_t* out_buf = static_cast<uint8_t*>(std::malloc(*out_len));
      if (out_buf != nullptr && *out_len > 0) {
        std::memcpy(out_buf, error_str.data(), *out_len);
      }
      return out_buf;
    }
  }

  operations_research::sat::Model model;

  // Single-threaded configuration: enforce num_search_workers = 1
  operations_research::sat::SatParameters params;
  params.set_num_search_workers(1);

  if (params_bytes != nullptr && params_len > 0) {
    operations_research::sat::SatParameters user_params;
    if (user_params.ParseFromArray(params_bytes, params_len)) {
      params.MergeFrom(user_params);
    }
  }
  // Enforce single worker regardless of user params to ensure compatibility without SharedArrayBuffer
  params.set_num_search_workers(1);

  model.Add(operations_research::sat::NewSatParameters(params));

  const operations_research::sat::CpSolverResponse response =
      operations_research::sat::SolveCpModel(model_proto, &model);

  std::string response_bytes;
  if (!response.SerializeToString(&response_bytes)) {
    return nullptr;
  }

  *out_len = static_cast<int>(response_bytes.size());
  uint8_t* out_buffer = static_cast<uint8_t*>(std::malloc(*out_len));
  if (out_buffer != nullptr && *out_len > 0) {
    std::memcpy(out_buffer, response_bytes.data(), *out_len);
  }
  return out_buffer;
}

/**
 * Releases heap-allocated memory returned by SolveProto.
 *
 * @param ptr Pointer previously returned by SolveProto.
 */
EMSCRIPTEN_KEEPALIVE
void FreeBuffer(uint8_t* ptr) {
  std::free(ptr);
}

}  // extern "C"
