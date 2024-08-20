cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

file(GLOB rnoh_in_call_manager_SRC CONFIGURE_DEPENDS *.cpp)
add_library(rnoh_in_call_manager SHARED ${rnoh_in_call_manager_SRC})
target_include_directories(rnoh_in_call_manager PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
target_link_libraries(rnoh_in_call_manager PUBLIC rnoh)

