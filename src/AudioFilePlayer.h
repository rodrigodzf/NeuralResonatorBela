#pragma once

#include <string>
#include <vector>
#include <filesystem>
#include <libraries/AudioFile/AudioFile.h>

class AudioFilePlayer
{
public:
    AudioFilePlayer(const std::string &filename)
    {   
        // check the file exists
        if (!std::filesystem::exists(filename))
        {
            fprintf(stderr, "Error: file not found: %s\n", filename.c_str());
            std::exit(1);
        }

        // Load file
        m_samples = AudioFileUtilities::loadMono(filename.c_str());
        reset_read_index();
    }

    void reset_read_index()
    {
        m_readIndex = 0;
    }

    void stop()
    {
        m_readIndex = -1;
    }

    void set_loop(bool loop)
    {
        m_loop = loop;
        reset_read_index();
    }

    float tick()
    {   
        if (m_readIndex != -1)
        {
            if (m_readIndex >= m_samples.size())
            {   
                if (!m_loop)
                {
                    m_readIndex = -1;
                    return 0.0f;
                }
                else
                {
                    m_readIndex = 0;
                }
            }

            return m_samples[m_readIndex++];
        }
        else
        {
            return 0.0f;
        }
    }

private:
    std::vector<float> m_samples;
    int m_readIndex = -1;
    bool m_loop = false;

};
