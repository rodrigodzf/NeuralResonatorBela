set(EXE_NAME NeuralResonatorBela)

file(GLOB SRC_FILES *.cpp)

add_executable(${EXE_NAME} ${SRC_FILES})

target_include_directories(
    ${EXE_NAME} PRIVATE ${BELA_ROOT} ${BELA_ROOT}/include
)

target_link_libraries(
    ${EXE_NAME}
    PRIVATE
    ${BELA_ROOT}/lib/libbelafull.so
    ${COBALT_LIB}
    ${NEON_LIB}
    ${MATHNEON_LIB}
    dl
    prussdrv
    asound
    atomic
    sndfile
    pthread
)